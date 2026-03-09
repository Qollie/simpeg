<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    private const URUTAN_GOLONGAN = [
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

    public function promotionEligibility(Request $request)
    {
        $perPage = max(1, min((int) $request->query('per_page', 10), 100));
        $pendidikan = $this->normalisasiPendidikan((string) $request->query('default_pendidikan', 'S1'));
        $maxRankOrder = $this->golonganOrder(self::BATAS_PANGKAT_PENDIDIKAN[$pendidikan] ?? 'Pembina (IV/a)');

        $query = $this->promotionBaseQuery($request, $maxRankOrder);

        $paginated = $query
            ->orderByDesc('masaKerjaGolonganTahun')
            ->orderByDesc('masaKerjaGolonganBulan')
            ->orderBy('nama')
            ->paginate($perPage);

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
        $nearYears = max(1, min((int) $request->query('near_years', 1), 3));
        $statusFilter = strtolower(trim((string) $request->query('status', 'semua')));

        $query = $this->satyalancanaBaseQuery($request, $nearYears);

        if (in_array($statusFilter, ['memenuhi', 'mendekati'], true)) {
            $query->where('statusSatya', $statusFilter);
        }

        $paginated = $query
            ->orderByRaw("CASE WHEN \"statusSatya\" = 'memenuhi' THEN 1 ELSE 0 END DESC")
            ->orderByDesc(DB::raw('("masaKerjaTahun" * 12 + "masaKerjaBulan")'))
            ->orderBy('nama')
            ->paginate($perPage);

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

    public function summary(Request $request)
    {
        $pendidikan = $this->normalisasiPendidikan((string) $request->query('default_pendidikan', 'S1'));
        $maxRankOrder = $this->golonganOrder(self::BATAS_PANGKAT_PENDIDIKAN[$pendidikan] ?? 'Pembina (IV/a)');
        $nearYears = max(1, min((int) $request->query('near_years', 1), 3));

        $promotionTotal = (clone $this->promotionBaseQuery($request, $maxRankOrder))->count();

        $satyaBase = $this->satyalancanaBaseQuery($request, $nearYears);
        $satyaMemenuhi = (clone $satyaBase)->where('statusSatya', 'memenuhi')->count();
        $satyaMendekati = (clone $satyaBase)->where('statusSatya', 'mendekati')->count();

        return response()->json([
            'promotionTotal' => $promotionTotal,
            'satyalancanaTotal' => $satyaMemenuhi + $satyaMendekati,
            'satyalancanaMemenuhi' => $satyaMemenuhi,
            'satyalancanaMendekati' => $satyaMendekati,
        ]);
    }

    public function exportPromotionCsv(Request $request): StreamedResponse
    {
        $pendidikan = $this->normalisasiPendidikan((string) $request->query('default_pendidikan', 'S1'));
        $maxRankOrder = $this->golonganOrder(self::BATAS_PANGKAT_PENDIDIKAN[$pendidikan] ?? 'Pembina (IV/a)');

        $rows = $this->promotionBaseQuery($request, $maxRankOrder)
            ->orderByDesc('masaKerjaGolonganTahun')
            ->orderByDesc('masaKerjaGolonganBulan')
            ->orderBy('nama')
            ->get();

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['NIP', 'Nama', 'Jabatan', 'Golongan', 'TMT Golongan', 'Masa Kerja Golongan (Tahun)', 'Masa Kerja Golongan (Bulan)', 'Layak Sejak']);

            foreach ($rows as $row) {
                fputcsv($out, [
                    $row->nipPegawai,
                    $row->nama,
                    $row->jabatan,
                    $row->golongan,
                    $row->tmtGolonganAktif,
                    $row->masaKerjaGolonganTahun,
                    $row->masaKerjaGolonganBulan,
                    $row->eligibleDate,
                ]);
            }

            fclose($out);
        }, 'karir-naik-pangkat.csv', ['Content-Type' => 'text/csv']);
    }

    public function exportSatyalancanaCsv(Request $request): StreamedResponse
    {
        $nearYears = max(1, min((int) $request->query('near_years', 1), 3));
        $statusFilter = strtolower(trim((string) $request->query('status', 'semua')));

        $query = $this->satyalancanaBaseQuery($request, $nearYears);
        if (in_array($statusFilter, ['memenuhi', 'mendekati'], true)) {
            $query->where('statusSatya', $statusFilter);
        }

        $rows = $query
            ->orderByRaw("CASE WHEN \"statusSatya\" = 'memenuhi' THEN 1 ELSE 0 END DESC")
            ->orderByDesc(DB::raw('("masaKerjaTahun" * 12 + "masaKerjaBulan")'))
            ->orderBy('nama')
            ->get();

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['NIP', 'Nama', 'Jabatan', 'Golongan', 'Tanggal Masuk', 'Masa Kerja (Tahun)', 'Masa Kerja (Bulan)', 'Status Satyalancana', 'Kategori']);

            foreach ($rows as $row) {
                fputcsv($out, [
                    $row->nipPegawai,
                    $row->nama,
                    $row->jabatan,
                    $row->golongan,
                    $row->tanggalMasuk,
                    $row->masaKerjaTahun,
                    $row->masaKerjaBulan,
                    $row->statusSatya,
                    $row->kategoriSatya,
                ]);
            }

            fclose($out);
        }, 'karir-satyalancana.csv', ['Content-Type' => 'text/csv']);
    }

    private function promotionBaseQuery(Request $request, int $maxRankOrder): Builder
    {
        $q = trim((string) $request->query('q', ''));

        $query = DB::query()->fromSub($this->pegawaiBaseQuery($request), 'b')
            ->select([
                'b.nipPegawai',
                'b.nama',
                'b.foto',
                'b.jabatan',
                'b.golongan',
                'b.tmtGolonganAktif',
                DB::raw("EXTRACT(YEAR FROM age(CURRENT_DATE, b.\"tmtGolonganAktif\"::date))::int as \"masaKerjaGolonganTahun\""),
                DB::raw("EXTRACT(MONTH FROM age(CURRENT_DATE, b.\"tmtGolonganAktif\"::date))::int as \"masaKerjaGolonganBulan\""),
                DB::raw("(b.\"tmtGolonganAktif\"::date + interval '4 years')::date as \"eligibleDate\""),
            ])
            ->whereNotNull('b.tmtGolonganAktif')
            ->whereRaw("(b.\"tmtGolonganAktif\"::date + interval '4 years')::date <= CURRENT_DATE")
            ->where(function ($sub) use ($maxRankOrder) {
                $sub->where('b.rankOrder', 0)
                    ->orWhere('b.rankOrder', '<', $maxRankOrder);
            });

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('b.nama', 'ilike', "%{$q}%")
                    ->orWhere('b.nipPegawai', 'ilike', "%{$q}%")
                    ->orWhere('b.jabatan', 'ilike', "%{$q}%");
            });
        }

        return $query;
    }

    private function satyalancanaBaseQuery(Request $request, int $nearYears): Builder
    {
        $q = trim((string) $request->query('q', ''));

        $withTenure = DB::query()->fromSub($this->pegawaiBaseQuery($request), 'b')
            ->select([
                'b.nipPegawai',
                'b.nama',
                'b.foto',
                'b.jabatan',
                'b.golongan',
                'b.tanggalMasuk',
                DB::raw("EXTRACT(YEAR FROM age(CURRENT_DATE, b.\"tanggalMasuk\"::date))::int as \"masaKerjaTahun\""),
                DB::raw("EXTRACT(MONTH FROM age(CURRENT_DATE, b.\"tanggalMasuk\"::date))::int as \"masaKerjaBulan\""),
            ])
            ->whereNotNull('b.tanggalMasuk');

        $withStatus = DB::query()->fromSub($withTenure, 't')
            ->select([
                't.nipPegawai',
                't.nama',
                't.foto',
                't.jabatan',
                't.golongan',
                't.tanggalMasuk',
                't.masaKerjaTahun',
                't.masaKerjaBulan',
                DB::raw(
                    "CASE
                        WHEN t.\"masaKerjaTahun\" >= 30 THEN 'memenuhi'
                        WHEN t.\"masaKerjaTahun\" >= 20 THEN 'memenuhi'
                        WHEN t.\"masaKerjaTahun\" >= 10 THEN 'memenuhi'
                        WHEN t.\"masaKerjaTahun\" >= (30 - {$nearYears}) THEN 'mendekati'
                        WHEN t.\"masaKerjaTahun\" >= (20 - {$nearYears}) THEN 'mendekati'
                        WHEN t.\"masaKerjaTahun\" >= (10 - {$nearYears}) THEN 'mendekati'
                        ELSE 'belum'
                    END as \"statusSatya\""
                ),
                DB::raw(
                    "CASE
                        WHEN t.\"masaKerjaTahun\" >= 30 THEN '30 Tahun'
                        WHEN t.\"masaKerjaTahun\" >= 20 THEN '20 Tahun'
                        WHEN t.\"masaKerjaTahun\" >= 10 THEN '10 Tahun'
                        WHEN t.\"masaKerjaTahun\" >= (30 - {$nearYears}) THEN 'Menuju 30 Tahun'
                        WHEN t.\"masaKerjaTahun\" >= (20 - {$nearYears}) THEN 'Menuju 20 Tahun'
                        WHEN t.\"masaKerjaTahun\" >= (10 - {$nearYears}) THEN 'Menuju 10 Tahun'
                        ELSE NULL
                    END as \"kategoriSatya\""
                ),
            ]);

        $query = DB::query()->fromSub($withStatus, 's')
            ->select([
                's.nipPegawai',
                's.nama',
                's.foto',
                's.jabatan',
                's.golongan',
                's.tanggalMasuk',
                's.masaKerjaTahun',
                's.masaKerjaBulan',
                's.statusSatya',
                's.kategoriSatya',
            ])
            ->where('s.statusSatya', '<>', 'belum');

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('s.nama', 'ilike', "%{$q}%")
                    ->orWhere('s.nipPegawai', 'ilike', "%{$q}%")
                    ->orWhere('s.jabatan', 'ilike', "%{$q}%");
            });
        }

        return $query;
    }

    private function pegawaiBaseQuery(Request $request): Builder
    {
        $latestRankSub = DB::table('RiwayatPangkat as rp')
            ->selectRaw('rp."nipRiwayat", MAX(rp."tmtPangkat") as latest_tmt')
            ->groupBy('rp.nipRiwayat');

        $statusRaw = 'LOWER(COALESCE(NULLIF(TRIM(p."status"), \'\'), NULLIF(TRIM(k."statusPegawai"), \'\'), \'aktif\'))';

        return DB::table('Pegawai as p')
            ->leftJoin('Kepegawaian as k', 'k.nipKepegawaian', '=', 'p.nipPegawai')
            ->leftJoinSub($latestRankSub, 'lr', function ($join) {
                $join->on('lr.nipRiwayat', '=', 'p.nipPegawai');
            })
            ->leftJoin('RiwayatPangkat as rp', function ($join) {
                $join->on('rp.nipRiwayat', '=', 'lr.nipRiwayat')
                    ->on('rp.tmtPangkat', '=', 'lr.latest_tmt');
            })
            ->leftJoin('Pangkat as pg', 'pg.idPangkat', '=', 'rp.idPangkatRiwayat')
            ->select([
                'p.nipPegawai',
                'p.nama',
                'p.foto',
                'p.jabatan',
                DB::raw("COALESCE(CONCAT(pg.pangkat, ' (', pg.golongan, ')'), p.golongan) as golongan"),
                DB::raw("COALESCE(rp.\"tmtPangkat\", p.\"tanggalMasuk\", k.\"tmtCpns\", k.\"tmtPns\") as \"tmtGolonganAktif\""),
                DB::raw("COALESCE(p.\"tanggalMasuk\", k.\"tmtCpns\", k.\"tmtPns\") as \"tanggalMasuk\""),
                DB::raw($this->rankCaseExpression("COALESCE(CONCAT(pg.pangkat, ' (', pg.golongan, ')'), p.golongan)") . ' as "rankOrder"'),
            ])
            ->whereRaw($statusRaw . " NOT IN ('cuti','pensiun','nonaktif','resign')");
    }

    private function rankCaseExpression(string $columnExpr): string
    {
        $cases = [];

        foreach (self::URUTAN_GOLONGAN as $idx => $value) {
            $order = $idx + 1;
            $escaped = str_replace("'", "''", $value);
            $cases[] = "WHEN {$columnExpr} = '{$escaped}' THEN {$order}";
        }

        return 'CASE ' . implode(' ', $cases) . ' ELSE 0 END';
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

    private function golonganOrder(string $golongan): int
    {
        $index = array_search($golongan, self::URUTAN_GOLONGAN, true);

        if ($index === false) {
            return 0;
        }

        return $index + 1;
    }
}
