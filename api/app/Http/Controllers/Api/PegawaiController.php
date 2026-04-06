<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EfilePegawai;
use App\Models\Kepegawaian;
use App\Models\IdentitasResmi;
use App\Models\KarirStatusProses;
use App\Models\Pangkat;
use App\Models\Pegawai;
use App\Models\RiwayatPangkat;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PegawaiController extends Controller
{
    private const STATUS_PEGAWAI_MAP = [
        '1' => 'PNS',
        '2' => 'PPPK',
        '3' => 'Non-ASN',
    ];

    private const JENIS_PEGAWAI_MAP = [
        '1' => 'Tenaga Struktural',
        '2' => 'Tenaga Fungsional',
        '3' => 'Tenaga Administrasi',
    ];

    private const JENIS_KELAMIN_MAP = [
        '1' => 'Laki-laki',
        '2' => 'Perempuan',
    ];

    private const AGAMA_MAP = [
        '1' => 'Islam',
        '2' => 'Kristen',
        '3' => 'Katolik',
        '4' => 'Hindu',
        '5' => 'Buddha',
        '6' => 'Konghucu',
        '7' => 'Lainnya',
    ];

    private const GOLONGAN_MAP = [
        '1'  => 'Juru Muda (I/a)',
        '2'  => 'Juru Muda Tingkat I (I/b)',
        '3'  => 'Juru (I/c)',
        '4'  => 'Juru Tingkat I (I/d)',
        '5'  => 'Pengatur Muda (II/a)',
        '6'  => 'Pengatur Muda Tingkat I (II/b)',
        '7'  => 'Pengatur (II/c)',
        '8'  => 'Pengatur Tingkat I (II/d)',
        '9'  => 'Penata Muda (III/a)',
        '10' => 'Penata Muda Tingkat I (III/b)',
        '11' => 'Penata (III/c)',
        '12' => 'Penata Tingkat I (III/d)',
        '13' => 'Pembina (IV/a)',
        '14' => 'Pembina Tingkat I (IV/b)',
        '15' => 'Pembina Utama Muda (IV/c)',
        '16' => 'Pembina Utama Madya (IV/d)',
        '17' => 'Pembina Utama (IV/e)',
    ];

    private function maximumBirthDate(): string
    {
        return Carbon::today()->subYears(17)->toDateString();
    }

    private function mapStatusPegawai(string $value): string
    {
        return self::STATUS_PEGAWAI_MAP[$value] ?? $value;
    }

    private function mapJenisPegawai(string $value): string
    {
        return self::JENIS_PEGAWAI_MAP[$value] ?? $value;
    }

    private function mapJenisKelamin(string $value): string
    {
        return self::JENIS_KELAMIN_MAP[$value] ?? $value;
    }

    private function mapAgama(string $value): string
    {
        return self::AGAMA_MAP[$value] ?? $value;
    }

    private function mapGolongan(string $value): string
    {
        return self::GOLONGAN_MAP[$value] ?? $value;
    }

    private function normalizeKepegawaianDates(array $validated): array
    {
        $statusPegawai = strtolower(trim((string) ($validated['statusPegawai'] ?? '')));

        if ($statusPegawai === 'pppk') {
            $validated['tmtCpns'] = null;
            $validated['tmtPns'] = null;
        }

        if ($statusPegawai === 'non-asn') {
            $validated['tmtCpns'] = null;
            $validated['tmtPns'] = null;
            $validated['tmtPppk'] = null;
        }

        return $validated;
    }

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
            $query->where('status', 'ilike', "%{$status}%");
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
            ->whereNotNull('Pegawai.status')
            ->selectRaw('DISTINCT "Pegawai"."status" as value')
            ->orderBy('value')
            ->pluck('value')
            ->filter()
            ->values();

        $pangkatOptions = Pangkat::query()
            ->selectRaw("CONCAT(\"pangkat\", ' (', \"golongan\", '/', \"ruang\", ')') as value")
            ->orderBy('urutan')
            ->pluck('value')
            ->filter()
            ->values();

        $payload = $result->toArray();
        $payload['filter_options'] = [
            'departemen' => $departemenOptions,
            'status' => $statusOptions,
            'pangkat' => $pangkatOptions,
        ];

        return response()->json($payload);
    }

    public function show($id)
    {
        $pegawai = Pegawai::with(['identitasResmi', 'kepegawaian', 'riwayatPangkat.pangkat', 'efiles'])->findOrFail($id);

        return response()->json($this->normalizePegawai($pegawai));
    }

    public function store(Request $request)
    {
        $pegawaiTable = (new Pegawai())->getTable();
        $identitasTable = (new IdentitasResmi())->getTable();

        $validated = $request->validate([
            'nipPegawai' => ['required', 'string', 'size:18', Rule::unique($pegawaiTable, 'nipPegawai')],
            'nama' => ['required', 'string', 'max:150'],
            'gelarDepan' => ['nullable', 'string', 'max:50'],
            'gelarBelakang' => ['nullable', 'string', 'max:50'],
            'tempatLahir' => ['required', 'string', 'max:100'],
            'tanggalLahir' => ['required', 'date', 'before_or_equal:'.$this->maximumBirthDate()],
            'jenisKelamin' => ['required', 'string', 'max:10'],
            'agama' => ['required', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'email' => ['required', 'email', 'max:120', Rule::unique($pegawaiTable, 'email')],
            'noHp' => ['required', 'string', 'max:20'],
            'jabatan' => ['required', 'string', 'max:150'],
            'golongan' => ['required', 'string', 'max:100'],
            'status' => ['required', 'string', 'max:20'],
            'departemen' => ['required', 'string', 'max:150'],
            'tanggalMasuk' => ['required', 'date', 'before_or_equal:today'],
            'foto' => ['nullable', 'file', 'image', 'max:5120'],

            // Identitas resmi
            'nik' => ['required', 'string', 'size:16', Rule::unique($identitasTable, 'nik')],
            'noBpjs' => ['nullable', 'string', 'max:20', Rule::unique($identitasTable, 'noBpjs')],
            'noNpwp' => ['nullable', 'string', 'max:25', Rule::unique($identitasTable, 'noNpwp')],
            'karpeg' => ['nullable', 'string', 'max:30', Rule::unique($identitasTable, 'karpeg')],
            'karsuKarsi' => ['nullable', 'string', 'max:30', Rule::unique($identitasTable, 'karsuKarsi')],
            'taspen' => ['nullable', 'string', 'max:30', Rule::unique($identitasTable, 'taspen')],

            // Kepegawaian
            'statusPegawai' => ['required', 'string', 'max:20'],
            'jenisPegawai' => ['required', 'string', 'max:50'],
            'tmtCpns' => ['nullable', 'date', 'before_or_equal:today'],
            'tmtPns' => ['nullable', 'date', 'before_or_equal:today', 'required_if:statusPegawai,1,PNS'],
            'tmtPppk' => ['nullable', 'date', 'before_or_equal:today', 'required_if:statusPegawai,2,PPPK'],
            'masaKerjaTahun' => ['required', 'integer', 'min:0'],
            'masaKerjaBulan' => ['required', 'integer', 'min:0', 'max:11'],
        ]);

        $validated['statusPegawai'] = $this->mapStatusPegawai((string) $validated['statusPegawai']);
        $validated['jenisPegawai'] = $this->mapJenisPegawai((string) $validated['jenisPegawai']);
        $validated['jenisKelamin'] = $this->mapJenisKelamin((string) $validated['jenisKelamin']);
        $validated['agama'] = $this->mapAgama((string) $validated['agama']);
        $validated['golongan'] = $this->mapGolongan((string) $validated['golongan']);
        $validated = $this->normalizeKepegawaianDates($validated);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $stored = $request->file('foto')->storeAs(
                'pegawai/photos',
                $validated['nipPegawai'].'-'.now()->format('YmdHis').'-'.Str::random(6).'.'.$request->file('foto')->getClientOriginalExtension(),
                'public'
            );
            $fotoPath = '/storage/'.$stored;
        }

        DB::transaction(function () use ($validated, $fotoPath) {
            Pegawai::create([
                'nipPegawai' => $validated['nipPegawai'],
                'nama' => $validated['nama'],
                'gelarDepan' => $validated['gelarDepan'] ?? null,
                'gelarBelakang' => $validated['gelarBelakang'] ?? null,
                'tempatLahir' => $validated['tempatLahir'],
                'tanggalLahir' => $validated['tanggalLahir'],
                'jenisKelamin' => $validated['jenisKelamin'],
                'agama' => $validated['agama'],
                'alamat' => $validated['alamat'] ?? null,
                'email' => $validated['email'],
                'noHp' => $validated['noHp'],
                'foto' => $fotoPath ?? '',
                'jabatan' => $validated['jabatan'],
                'golongan' => $validated['golongan'],
                'status' => $validated['status'],
                'departemen' => $validated['departemen'],
                'tanggalMasuk' => $validated['tanggalMasuk'],
            ]);

            IdentitasResmi::create([
                'nipIdResmi' => $validated['nipPegawai'],
                'nik' => $validated['nik'],
                'noBpjs' => $validated['noBpjs'] ?? null,
                'noNpwp' => $validated['noNpwp'] ?? null,
                'karpeg' => $validated['karpeg'] ?? null,
                'karsuKarsi' => $validated['karsuKarsi'] ?? null,
                'taspen' => $validated['taspen'] ?? null,
            ]);

            Kepegawaian::create([
                'nipKepegawaian' => $validated['nipPegawai'],
                'statusPegawai' => $validated['statusPegawai'],
                'jenisPegawai' => $validated['jenisPegawai'],
                'tmtCpns' => $validated['tmtCpns'] ?? null,
                'tmtPns' => $validated['tmtPns'] ?? null,
                'tmtPppk' => $validated['tmtPppk'] ?? null,
                'masaKerjaTahun' => $validated['masaKerjaTahun'],
                'masaKerjaBulan' => $validated['masaKerjaBulan'],
            ]);
        });

        $pegawai = Pegawai::with(['identitasResmi', 'kepegawaian', 'riwayatPangkat.pangkat', 'efiles'])
            ->findOrFail($validated['nipPegawai']);

        return response()->json($this->normalizePegawai($pegawai), 201);
    }

    public function update(Request $request, string $id)
    {
        $pegawai = Pegawai::with(['identitasResmi', 'kepegawaian', 'riwayatPangkat.pangkat', 'efiles'])->findOrFail($id);
        $existingKepegawaian = $pegawai->kepegawaian;

        $pegawaiTable = (new Pegawai())->getTable();
        $identitasTable = (new IdentitasResmi())->getTable();

        $validated = $request->validate([
            'nama' => ['nullable', 'string', 'max:150'],
            'gelarDepan' => ['nullable', 'string', 'max:50'],
            'gelarBelakang' => ['nullable', 'string', 'max:50'],
            'tempatLahir' => ['nullable', 'string', 'max:100'],
            'tanggalLahir' => ['nullable', 'date', 'before_or_equal:'.$this->maximumBirthDate()],
            'jenisKelamin' => ['nullable', 'string', 'max:10'],
            'agama' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'email' => ['nullable', 'email', 'max:120', 'unique:Pegawai,email,'.$id.',nipPegawai'],
            'noHp' => ['nullable', 'string', 'max:20'],
            'jabatan' => ['nullable', 'string', 'max:150'],
            'golongan' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:20'],
            'departemen' => ['nullable', 'string', 'max:150'],
            'tanggalMasuk' => ['nullable', 'date', 'before_or_equal:today'],
            'foto' => ['nullable', 'file', 'image', 'max:5120'],

            // Identitas resmi
            'nik' => ['nullable', 'string', 'size:16', Rule::unique($identitasTable, 'nik')->ignore($pegawai->identitasResmi?->nipIdResmi, 'nipIdResmi')],
            'noBpjs' => ['nullable', 'string', 'max:20', Rule::unique($identitasTable, 'noBpjs')->ignore($pegawai->identitasResmi?->nipIdResmi, 'nipIdResmi')],
            'noNpwp' => ['nullable', 'string', 'max:25', Rule::unique($identitasTable, 'noNpwp')->ignore($pegawai->identitasResmi?->nipIdResmi, 'nipIdResmi')],
            'karpeg' => ['nullable', 'string', 'max:30', Rule::unique($identitasTable, 'karpeg')->ignore($pegawai->identitasResmi?->nipIdResmi, 'nipIdResmi')],
            'karsuKarsi' => ['nullable', 'string', 'max:30', Rule::unique($identitasTable, 'karsuKarsi')->ignore($pegawai->identitasResmi?->nipIdResmi, 'nipIdResmi')],
            'taspen' => ['nullable', 'string', 'max:30', Rule::unique($identitasTable, 'taspen')->ignore($pegawai->identitasResmi?->nipIdResmi, 'nipIdResmi')],

            // Kepegawaian
            'statusPegawai' => ['nullable', 'string', 'max:20'],
            'jenisPegawai' => ['nullable', 'string', 'max:50'],
            'tmtCpns' => ['nullable', 'date', 'before_or_equal:today'],
            'tmtPns' => ['nullable', 'date', 'before_or_equal:today'],
            'tmtPppk' => ['nullable', 'date', 'before_or_equal:today'],
            'masaKerjaTahun' => ['nullable', 'integer', 'min:0'],
            'masaKerjaBulan' => ['nullable', 'integer', 'min:0', 'max:11'],
        ]);

        if (array_key_exists('statusPegawai', $validated)) {
            $validated['statusPegawai'] = $this->mapStatusPegawai((string) $validated['statusPegawai']);
        }
        if (array_key_exists('jenisPegawai', $validated)) {
            $validated['jenisPegawai'] = $this->mapJenisPegawai((string) $validated['jenisPegawai']);
        }
        if (array_key_exists('jenisKelamin', $validated)) {
            $validated['jenisKelamin'] = $this->mapJenisKelamin((string) $validated['jenisKelamin']);
        }
        if (array_key_exists('agama', $validated)) {
            $validated['agama'] = $this->mapAgama((string) $validated['agama']);
        }
        if (array_key_exists('golongan', $validated)) {
            $validated['golongan'] = $this->mapGolongan((string) $validated['golongan']);
        }
        $validated = $this->normalizeKepegawaianDates($validated);

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

        // Update identitas resmi (if any field provided)
        if ($request->hasAny(['nik', 'noBpjs', 'noNpwp', 'karpeg', 'karsuKarsi', 'taspen'])) {
            $identitasPayload = [
                'nik' => $request->input('nik', $pegawai->identitasResmi?->nik),
                'noBpjs' => $request->input('noBpjs', $pegawai->identitasResmi?->noBpjs),
                'noNpwp' => $request->input('noNpwp', $pegawai->identitasResmi?->noNpwp),
                'karpeg' => $request->input('karpeg', $pegawai->identitasResmi?->karpeg),
                'karsuKarsi' => $request->input('karsuKarsi', $pegawai->identitasResmi?->karsuKarsi),
                'taspen' => $request->input('taspen', $pegawai->identitasResmi?->taspen),
            ];

            IdentitasResmi::updateOrCreate(
                ['nipIdResmi' => $id],
                $identitasPayload + ['nipIdResmi' => $id]
            );
        }

        // Update kepegawaian (if any kepegawaian-related field provided)
        if ($request->hasAny(['statusPegawai', 'jenisPegawai', 'tmtCpns', 'tmtPns', 'tmtPppk', 'masaKerjaTahun', 'masaKerjaBulan', 'departemen'])) {
            $existing = $existingKepegawaian ?? Kepegawaian::where('nipKepegawaian', $id)->first();

            $kepegawaianPayload = [
                'statusPegawai' => $request->input('statusPegawai', $existing?->statusPegawai),
                'jenisPegawai' => $request->input('jenisPegawai', $existing?->jenisPegawai ?? $request->input('departemen')),
                'tmtCpns' => $request->input('tmtCpns', $existing?->tmtCpns),
                'tmtPns' => $request->input('tmtPns', $existing?->tmtPns),
                'tmtPppk' => $request->input('tmtPppk', $existing?->tmtPppk),
                'masaKerjaTahun' => $request->input('masaKerjaTahun', $existing?->masaKerjaTahun ?? 0),
                'masaKerjaBulan' => $request->input('masaKerjaBulan', $existing?->masaKerjaBulan ?? 0),
            ];

            if (!empty($kepegawaianPayload['statusPegawai'])) {
                $kepegawaianPayload['statusPegawai'] = $this->mapStatusPegawai((string) $kepegawaianPayload['statusPegawai']);
            }

            if (!empty($kepegawaianPayload['jenisPegawai'])) {
                $kepegawaianPayload['jenisPegawai'] = $this->mapJenisPegawai((string) $kepegawaianPayload['jenisPegawai']);
            }

            $kepegawaianPayload = $this->normalizeKepegawaianDates($kepegawaianPayload);

            Kepegawaian::updateOrCreate(
                ['nipKepegawaian' => $id],
                $kepegawaianPayload + ['nipKepegawaian' => $id]
            );

            $oldTmtPns = $existing?->tmtPns ? Carbon::parse($existing->tmtPns)->toDateString() : null;
            $newTmtPns = !empty($kepegawaianPayload['tmtPns'])
                ? Carbon::parse($kepegawaianPayload['tmtPns'])->toDateString()
                : null;

            if ($oldTmtPns !== $newTmtPns) {
                KarirStatusProses::query()
                    ->where('nipPegawai', $id)
                    ->delete();

                RiwayatPangkat::query()
                    ->where('nipRiwayat', $id)
                    ->delete();
            }
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

    private function resolvePublicPath(?string $filePath): ?string
    {
        if (empty($filePath)) {
            return null;
        }

        // Jika sudah URL penuh, coba ambil bagian setelah /storage/
        if (Str::startsWith($filePath, ['http://', 'https://'])) {
            $pos = strpos($filePath, '/storage/');
            if ($pos !== false) {
                $filePath = substr($filePath, $pos);
            } else {
                // URL eksternal, biarkan caller menangani
                return $filePath;
            }
        }

        if (Str::startsWith($filePath, '/storage/')) {
            return ltrim(substr($filePath, 9), '/'); // remove "/storage/"
        }

        if (Str::startsWith($filePath, 'storage/')) {
            return ltrim(substr($filePath, 8), '/'); // remove "storage/"
        }

        return ltrim($filePath, '/');
    }

    public function streamDocument(string $id): StreamedResponse|\Illuminate\Http\RedirectResponse
    {
        $efile = EfilePegawai::query()->findOrFail((int) $id);

        $relative = $this->resolvePublicPath($efile->filePath);

        // Jika filePath adalah URL eksternal (bukan menuju storage), redirect
        if (Str::startsWith($relative, ['http://', 'https://'])) {
            return redirect()->away($relative);
        }

        if (!$relative || !Storage::disk('public')->exists($relative)) {
            abort(404, 'File tidak ditemukan');
        }

        $mime = Storage::disk('public')->mimeType($relative) ?: 'application/octet-stream';
        $path = Storage::disk('public')->path($relative);

        return response()->file($path, ['Content-Type' => $mime]);
    }

    public function downloadDocument(string $id)
    {
        $efile = EfilePegawai::query()->findOrFail((int) $id);

        $relative = $this->resolvePublicPath($efile->filePath);

        if (Str::startsWith($relative, ['http://', 'https://'])) {
            return redirect()->away($relative);
        }

        if (!$relative || !Storage::disk('public')->exists($relative)) {
            abort(404, 'File tidak ditemukan');
        }

        $path = Storage::disk('public')->path($relative);
        $downloadName = $efile->namaFile ?: basename($path);

        return response()->download($path, $downloadName);
    }

    public function destroy(string $id)
    {
        $pegawai = Pegawai::with(['efiles', 'identitasResmi', 'kepegawaian', 'riwayatPangkat'])->findOrFail($id);

        DB::transaction(function () use ($pegawai) {
            // Hapus file e-pegawai di storage
            foreach ($pegawai->efiles as $efile) {
                if (!empty($efile->filePath) && str_starts_with($efile->filePath, '/storage/')) {
                    $relative = ltrim(str_replace('/storage/', '', $efile->filePath), '/');
                    Storage::disk('public')->delete($relative);
                }
            }

            $pegawai->efiles()->delete();
            $pegawai->riwayatPangkat()->delete();
            $pegawai->kepegawaian()->delete();
            $pegawai->identitasResmi()->delete();
            $pegawai->delete();
        });

        return response()->json(['message' => 'Pegawai dihapus']);
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
