<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CareerController extends Controller
{
    private const STATUS_NON_AKTIF = ['cuti', 'pensiun', 'nonaktif', 'resign'];

    private const BATAS_PANGKAT_PENDIDIKAN = [
        'SMA' => 'Pengatur Tingkat I (II/d)',
        'D3' => 'Penata Tingkat I (III/d)',
        'D4' => 'Pembina (IV/a)',
        'S1' => 'Pembina (IV/a)',
        'S2' => 'Pembina Utama Madya (IV/d)',
        'S3' => 'Pembina Utama (IV/e)',
    ];

    private const MILESTONE_SATYA = [10, 20, 30];

    public function promotionEligibility(Request $request)
    {
        $perPage = max(1, min((int) $request->query('per_page', 10), 100));
        $page = max(1, (int) $request->query('page', 1));
        $q = trim((string) $request->query('q', ''));
        $pendidikanDefault = $this->normalisasiPendidikan((string) $request->query('default_pendidikan', 'S1'));

        $query = Pegawai::query()->with([
            'kepegawaian',
            'riwayatPangkatTerbaru.pangkat',
        ]);

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('nama', 'ilike', "%{$q}%")
                    ->orWhere('nipPegawai', 'ilike', "%{$q}%")
                    ->orWhere('jabatan', 'ilike', "%{$q}%");
            });
        }

        $items = $query
            ->orderBy('nama')
            ->get()
            ->map(function (Pegawai $pegawai) use ($pendidikanDefault) {
                $statusAktif = $this->statusAktif($pegawai);
                $pendidikan = $pendidikanDefault;
                $golonganSaatIni = $this->getGolonganSaatIni($pegawai);
                $maxRankReached = $this->isMaxRankReached($golonganSaatIni, $pendidikan);
                $tmtGolongan = $this->getTmtGolonganAktif($pegawai);
                $masaKerja = $this->hitungMasaKerja($tmtGolongan);
                $eligibleDate = $this->calculateEligibleDate($tmtGolongan, 4);
                $layak = $statusAktif && !$maxRankReached && $eligibleDate !== null && now()->greaterThanOrEqualTo($eligibleDate);

                return [
                    'nipPegawai' => $pegawai->nipPegawai,
                    'nama' => $pegawai->nama,
                    'jabatan' => $pegawai->jabatan,
                    'golongan' => $golonganSaatIni,
                    'status' => $pegawai->status,
                    'tmtGolonganAktif' => $tmtGolongan,
                    'masaKerjaGolonganTahun' => $masaKerja['tahun'],
                    'masaKerjaGolonganBulan' => $masaKerja['bulan'],
                    'eligibleDate' => $eligibleDate?->toDateString(),
                    'pendidikan' => $pendidikan,
                    'layakNaikPangkat' => $layak,
                ];
            })
            ->filter(fn (array $item) => $item['layakNaikPangkat'])
            ->sortByDesc(function (array $item) {
                return ($item['masaKerjaGolonganTahun'] * 12) + $item['masaKerjaGolonganBulan'];
            })
            ->values();

        $paginated = $this->paginateCollection($items, $page, $perPage);

        return response()->json([
            'data' => $paginated->items(),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function satyalancana(Request $request)
    {
        $perPage = max(1, min((int) $request->query('per_page', 10), 100));
        $page = max(1, (int) $request->query('page', 1));
        $q = trim((string) $request->query('q', ''));
        $statusFilter = strtolower(trim((string) $request->query('status', 'semua')));
        $nearYears = max(1, min((int) $request->query('near_years', 1), 3));

        $query = Pegawai::query()->with([
            'kepegawaian',
            'riwayatPangkatTerbaru.pangkat',
        ]);

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('nama', 'ilike', "%{$q}%")
                    ->orWhere('nipPegawai', 'ilike', "%{$q}%")
                    ->orWhere('jabatan', 'ilike', "%{$q}%");
            });
        }

        $items = $query
            ->orderBy('nama')
            ->get()
            ->map(function (Pegawai $pegawai) use ($nearYears) {
                if (!$this->statusAktif($pegawai)) {
                    return null;
                }

                $tmtMasuk = $pegawai->tanggalMasuk
                    ?? $pegawai->kepegawaian?->tmtCpns
                    ?? $pegawai->kepegawaian?->tmtPns;

                $masaKerja = $this->hitungMasaKerja($tmtMasuk);
                $tercapai = collect(self::MILESTONE_SATYA)->filter(fn (int $m) => $masaKerja['tahun'] >= $m)->last();
                $berikutnya = collect(self::MILESTONE_SATYA)->first(fn (int $m) => $masaKerja['tahun'] < $m);

                $statusSatya = 'belum';
                $kategoriSatya = null;
                $milestoneTarget = null;

                if ($tercapai !== null) {
                    $statusSatya = 'memenuhi';
                    $kategoriSatya = sprintf('%d Tahun', $tercapai);
                    $milestoneTarget = (int) $tercapai;
                } elseif ($berikutnya !== null && ($berikutnya - $masaKerja['tahun']) <= $nearYears) {
                    $statusSatya = 'mendekati';
                    $kategoriSatya = sprintf('Menuju %d Tahun', $berikutnya);
                    $milestoneTarget = (int) $berikutnya;
                }

                if ($statusSatya === 'belum') {
                    return null;
                }

                return [
                    'nipPegawai' => $pegawai->nipPegawai,
                    'nama' => $pegawai->nama,
                    'jabatan' => $pegawai->jabatan,
                    'golongan' => $this->getGolonganSaatIni($pegawai),
                    'status' => $pegawai->status,
                    'tanggalMasuk' => $tmtMasuk,
                    'masaKerjaTahun' => $masaKerja['tahun'],
                    'masaKerjaBulan' => $masaKerja['bulan'],
                    'statusSatya' => $statusSatya,
                    'kategoriSatya' => $kategoriSatya,
                    'milestoneTarget' => $milestoneTarget,
                ];
            })
            ->filter()
            ->filter(function (array $item) use ($statusFilter) {
                if (!in_array($statusFilter, ['memenuhi', 'mendekati'], true)) {
                    return true;
                }

                return $item['statusSatya'] === $statusFilter;
            })
            ->sortByDesc(function (array $item) {
                $statusWeight = $item['statusSatya'] === 'memenuhi' ? 1 : 0;

                return ($statusWeight * 10000) + (($item['masaKerjaTahun'] * 12) + $item['masaKerjaBulan']);
            })
            ->values();

        $paginated = $this->paginateCollection($items, $page, $perPage);

        return response()->json([
            'data' => $paginated->items(),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
            'filter_options' => [
                'status' => ['semua', 'memenuhi', 'mendekati'],
            ],
        ]);
    }

    private function paginateCollection(Collection $collection, int $page, int $perPage): LengthAwarePaginator
    {
        $total = $collection->count();
        $slice = $collection->forPage($page, $perPage)->values();

        return new LengthAwarePaginator(
            $slice,
            $total,
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );
    }

    private function statusAktif(Pegawai $pegawai): bool
    {
        $raw = trim((string) ($pegawai->status ?? $pegawai->kepegawaian?->statusPegawai ?? 'Aktif'));
        if ($raw === '') {
            return true;
        }

        return !in_array(strtolower($raw), self::STATUS_NON_AKTIF, true);
    }

    private function getTmtGolonganAktif(Pegawai $pegawai): ?string
    {
        return $pegawai->riwayatPangkatTerbaru?->tmtPangkat
            ?? $pegawai->tanggalMasuk
            ?? $pegawai->kepegawaian?->tmtCpns
            ?? $pegawai->kepegawaian?->tmtPns;
    }

    private function getGolonganSaatIni(Pegawai $pegawai): ?string
    {
        if ($pegawai->riwayatPangkatTerbaru?->pangkat) {
            $pangkat = $pegawai->riwayatPangkatTerbaru->pangkat;
            return trim(sprintf('%s (%s)', $pangkat->pangkat ?? '', $pangkat->golongan ?? ''));
        }

        return $pegawai->golongan;
    }

    private function hitungMasaKerja(?string $tanggalAwal): array
    {
        if (!$tanggalAwal) {
            return ['tahun' => 0, 'bulan' => 0];
        }

        try {
            $mulai = Carbon::parse($tanggalAwal);
        } catch (\Throwable $e) {
            return ['tahun' => 0, 'bulan' => 0];
        }

        $sekarang = now();
        $tahun = $mulai->diffInYears($sekarang);
        $anchor = $mulai->copy()->addYears($tahun);
        $bulan = $anchor->diffInMonths($sekarang);

        return ['tahun' => $tahun, 'bulan' => $bulan];
    }

    private function calculateEligibleDate(?string $tanggalAwal, int $tahun): ?\Illuminate\Support\Carbon
    {
        if (!$tanggalAwal) {
            return null;
        }

        try {
            return Carbon::parse($tanggalAwal)->addYears($tahun);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function normalisasiPendidikan(string $pendidikan): string
    {
        $raw = strtoupper(trim($pendidikan));

        return match ($raw) {
            'SMK' => 'SMA',
            'DIPLOMA 3', 'DIPLOMA III' => 'D3',
            'DIPLOMA 4', 'DIPLOMA IV' => 'D4',
            'STRATA 1' => 'S1',
            'STRATA 2' => 'S2',
            'STRATA 3' => 'S3',
            default => in_array($raw, ['SMA', 'D3', 'D4', 'S1', 'S2', 'S3'], true) ? $raw : 'S1',
        };
    }

    private function isMaxRankReached(?string $golonganSaatIni, string $pendidikan): bool
    {
        if (!$golonganSaatIni) {
            return false;
        }

        if (!array_key_exists($pendidikan, self::BATAS_PANGKAT_PENDIDIKAN)) {
            return false;
        }

        $urutanGolongan = [
            'Juru Muda (I/a)',
            'Juru Muda Tingkat I (I/b)',
            'Juru (I/c)',
            'Juru Tingkat I (I/d)',
            'Pengatur Muda (II/a)',
            'Pengatur Muda Tingkat I (II/b)',
            'Pengatur (II/c)',
            'Pengatur Tingkat I (II/d)',
            'Penata Muda (III/a)',
            'Penata Muda Tingkat I (III/b)',
            'Penata (III/c)',
            'Penata Tingkat I (III/d)',
            'Pembina (IV/a)',
            'Pembina Tingkat I (IV/b)',
            'Pembina Utama Muda (IV/c)',
            'Pembina Utama Madya (IV/d)',
            'Pembina Utama (IV/e)',
        ];

        $currentIndex = array_search($golonganSaatIni, $urutanGolongan, true);
        $maxIndex = array_search(self::BATAS_PANGKAT_PENDIDIKAN[$pendidikan], $urutanGolongan, true);

        if ($currentIndex === false || $maxIndex === false) {
            return false;
        }

        return $currentIndex >= $maxIndex;
    }
}
