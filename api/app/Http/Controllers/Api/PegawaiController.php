<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EfilePegawai;
use App\Models\Kepegawaian;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 15);
        $page = (int) $request->query('page', 1);
        $q = trim((string) $request->query('q', ''));
        $departemen = trim((string) $request->query('departemen', ''));
        $status = trim((string) $request->query('status', ''));

        $query = Pegawai::with([
            'identitasResmi',
            'kepegawaian',
            'riwayatPangkat.pangkat',
            'efiles',
        ]);

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('nama', 'ilike', "%{$q}%")
                    ->orWhere('nipPegawai', 'ilike', "%{$q}%")
                    ->orWhere('email', 'ilike', "%{$q}%")
                    ->orWhereHas('identitasResmi', function ($idResmi) use ($q) {
                        $idResmi->where('nik', 'ilike', "%{$q}%");
                    });
            });
        }

        if ($departemen && $departemen !== 'Semua') {
            $query->whereHas('kepegawaian', function ($kepegawaian) use ($departemen) {
                $kepegawaian->where('jenisPegawai', 'ilike', "%{$departemen}%");
            });
        }

        if ($status && $status !== 'Semua') {
            $query->whereHas('kepegawaian', function ($kepegawaian) use ($status) {
                $kepegawaian->where('statusPegawai', 'ilike', "%{$status}%");
            });
        }

        $result = $query->orderBy('nama')->paginate($perPage, ['*'], 'page', $page);

        $result->setCollection(
            $result->getCollection()->map(function (Pegawai $pegawai) {
                return $this->normalizePegawai($pegawai);
            })
        );

        $departemenOptions = Pegawai::query()
            ->join('Kepegawaian', 'Kepegawaian.nipKepegawaian', '=', 'Pegawai.nipPegawai')
            ->whereNotNull('Kepegawaian.jenisPegawai')
            ->selectRaw('DISTINCT "Kepegawaian"."jenisPegawai" as value')
            ->orderBy('value')
            ->pluck('value')
            ->filter()
            ->values();

        $statusOptions = Pegawai::query()
            ->join('Kepegawaian', 'Kepegawaian.nipKepegawaian', '=', 'Pegawai.nipPegawai')
            ->whereNotNull('Kepegawaian.statusPegawai')
            ->selectRaw('DISTINCT "Kepegawaian"."statusPegawai" as value')
            ->orderBy('value')
            ->pluck('value')
            ->filter()
            ->values();

        $payload = $result->toArray();
        $payload['filter_options'] = [
            'departemen' => $departemenOptions,
            'status' => $statusOptions,
        ];

        return response()->json($payload);
    }

    public function show($id)
    {
        $pegawai = Pegawai::with(['identitasResmi', 'kepegawaian', 'riwayatPangkat.pangkat', 'efiles'])->findOrFail($id);

        return response()->json($this->normalizePegawai($pegawai));
    }

    public function update(Request $request, string $id)
    {
        $pegawai = Pegawai::with(['identitasResmi', 'kepegawaian', 'riwayatPangkat.pangkat', 'efiles'])->findOrFail($id);

        $validated = $request->validate([
            'nama' => ['nullable', 'string', 'max:150'],
            'gelarDepan' => ['nullable', 'string', 'max:50'],
            'gelarBelakang' => ['nullable', 'string', 'max:50'],
            'tempatLahir' => ['nullable', 'string', 'max:100'],
            'tanggalLahir' => ['nullable', 'date'],
            'jenisKelamin' => ['nullable', 'string', 'max:20'],
            'agama' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'email' => ['nullable', 'email', 'max:120', 'unique:Pegawai,email,'.$id.',nipPegawai'],
            'noHp' => ['nullable', 'string', 'max:20'],
            'jabatan' => ['nullable', 'string', 'max:150'],
            'golongan' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:30'],
            'departemen' => ['nullable', 'string', 'max:150'],
            'tanggalMasuk' => ['nullable', 'date'],
            'foto' => ['nullable', 'file', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('foto')) {
            $stored = $request->file('foto')->storeAs(
                'pegawai/photos',
                $id.'-'.now()->format('YmdHis').'-'.Str::random(6).'.'.$request->file('foto')->getClientOriginalExtension(),
                'public'
            );

            $validated['foto'] = '/storage/'.$stored;
        }

        $pegawai->fill($validated);
        $pegawai->save();

        if ($request->filled('departemen') || $request->filled('status')) {
            $existing = Kepegawaian::where('nipKepegawaian', $id)->first();

            Kepegawaian::updateOrCreate(
                ['nipKepegawaian' => $id],
                [
                    'statusPegawai' => $request->input('status', $existing?->statusPegawai ?? 'PNS'),
                    'jenisPegawai' => $request->input('departemen', $existing?->jenisPegawai ?? '-'),
                    'tmtCpns' => $existing?->tmtCpns,
                    'tmtPns' => $existing?->tmtPns,
                    'masaKerjaTahun' => $existing?->masaKerjaTahun ?? 0,
                    'masaKerjaBulan' => $existing?->masaKerjaBulan ?? 0,
                ]
            );
        }

        $pegawai->refresh()->load(['identitasResmi', 'kepegawaian', 'riwayatPangkat.pangkat', 'efiles']);

        return response()->json($this->normalizePegawai($pegawai));
    }

    public function uploadDocument(Request $request, string $id)
    {
        Pegawai::query()->findOrFail($id);

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'],
            'jenisDokumen' => ['nullable', 'string', 'max:30'],
            'namaFile' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('file');
        $stored = $file->storeAs(
            'pegawai/documents',
            $id.'-'.now()->format('YmdHis').'-'.Str::random(6).'.'.$file->getClientOriginalExtension(),
            'public'
        );

        $efile = EfilePegawai::create([
            'nipEfile' => $id,
            'jenisDokumen' => $validated['jenisDokumen'] ?? strtoupper($file->getClientOriginalExtension()),
            'namaFile' => $validated['namaFile'] ?? $file->getClientOriginalName(),
            'filePath' => '/storage/'.$stored,
            'waktuUpload' => now(),
        ]);

        return response()->json([
            'idFile' => $efile->idFile,
            'nipEfile' => $efile->nipEfile,
            'jenisDokumen' => $efile->jenisDokumen,
            'namaFile' => $efile->namaFile,
            'filePath' => $this->normalizeFilePath($efile->filePath),
            'waktuUpload' => $efile->waktuUpload,
        ], 201);
    }

    public function renameDocument(Request $request, string $id)
    {
        $validated = $request->validate([
            'namaFile' => ['required', 'string', 'max:255'],
        ]);

        $efile = EfilePegawai::query()->findOrFail((int) $id);
        $efile->namaFile = $validated['namaFile'];
        $efile->save();

        return response()->json([
            'idFile' => $efile->idFile,
            'nipEfile' => $efile->nipEfile,
            'jenisDokumen' => $efile->jenisDokumen,
            'namaFile' => $efile->namaFile,
            'filePath' => $this->normalizeFilePath($efile->filePath),
            'waktuUpload' => $efile->waktuUpload,
        ]);
    }

    public function deleteDocument(string $id)
    {
        $efile = EfilePegawai::query()->findOrFail((int) $id);

        if (!empty($efile->filePath) && str_starts_with($efile->filePath, '/storage/')) {
            $relative = ltrim(str_replace('/storage/', '', $efile->filePath), '/');
            Storage::disk('public')->delete($relative);
        }

        $efile->delete();

        return response()->json(['message' => 'Dokumen dihapus']);
    }

    private function normalizePegawai(Pegawai $pegawai): array
    {
        $data = $pegawai->toArray();

        if (!empty($data['foto'])) {
            $data['foto'] = $this->normalizeFilePath($data['foto']);
        }

        if (!empty($data['efiles']) && is_array($data['efiles'])) {
            $data['efiles'] = array_map(function (array $efile) {
                if (!empty($efile['filePath'])) {
                    $efile['filePath'] = $this->normalizeFilePath($efile['filePath']);
                }

                return $efile;
            }, $data['efiles']);
        }

        return $data;
    }

    private function normalizeFilePath(string $path): string
    {
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        return url($path);
    }
}
