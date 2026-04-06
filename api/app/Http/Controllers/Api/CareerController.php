<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KarirStatusProses;
use App\Models\Pangkat;
use App\Models\Pegawai;
use App\Models\RiwayatPangkat;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CareerController extends Controller
{
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

        $items = array_map(fn ($item) => $this->normalizeCareerItem($item), $paginated->items());

        return response()->json([
            'data' => $items,
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

        $items = array_map(fn ($item) => $this->normalizeCareerItem($item), $paginated->items());

        return response()->json([
            'data' => $items,
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

    public function processStatuses(Request $request)
    {
        $perPage = max(1, min((int) $request->query('per_page', 10), 100));
        $page = max(1, (int) $request->query('page', 1));
        $q = trim((string) $request->query('q', ''));
        $pendidikan = $this->normalisasiPendidikan((string) $request->query('default_pendidikan', 'S1'));
        $maxRankOrder = $this->golonganOrder(self::BATAS_PANGKAT_PENDIDIKAN[$pendidikan] ?? 'Pembina (IV/a)');

        $this->ensureCurrentPromotionCycles($request, $maxRankOrder);

        $query = DB::table('KarirStatusProses as ks')
            ->joinSub($this->pegawaiBaseQuery($request), 'b', function ($join) {
                $join->on('b.nipPegawai', '=', 'ks.nipPegawai');
            })
            ->select([
                'ks.id',
                'ks.nipPegawai',
                'b.nama',
                'b.golongan',
                'ks.cycleNumber',
                'ks.tmtGolonganDasar',
                'ks.eligibleDate',
                'ks.status',
                'ks.processedAt',
            ])
            ->whereNotNull('ks.eligibleDate');

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('b.nama', 'ilike', "%{$q}%")
                    ->orWhere('ks.nipPegawai', 'ilike', "%{$q}%");
            });
        }

        $rows = collect($query
            ->orderByDesc('ks.eligibleDate')
            ->orderByDesc('ks.cycleNumber')
            ->orderBy('b.nama')
            ->get())
            ->groupBy('nipPegawai')
            ->flatMap(function ($pegawaiRows) {
                $ordered = $pegawaiRows->sortBy('cycleNumber')->values();
                $firstPendingIndex = $ordered->search(fn ($row) => !(bool) $row->status);

                if ($firstPendingIndex === false) {
                    return $ordered;
                }

                return $ordered->slice(0, $firstPendingIndex + 1)->values();
            })
            ->sort(function ($a, $b) {
                $dateCompare = strcmp((string) $b->eligibleDate, (string) $a->eligibleDate);
                if ($dateCompare !== 0) {
                    return $dateCompare;
                }

                $cycleCompare = (int) $b->cycleNumber <=> (int) $a->cycleNumber;
                if ($cycleCompare !== 0) {
                    return $cycleCompare;
                }

                return strcmp((string) $a->nama, (string) $b->nama);
            })
            ->values();

        $total = $rows->count();
        $items = $rows
            ->slice(($page - 1) * $perPage, $perPage)
            ->values()
            ->map(function ($row) {
                return [
                    'id'         => $row->id,
                    'nipPegawai' => $row->nipPegawai,
                    'nama'       => $row->nama,
                    'golongan'   => $row->golongan,
                    'cycleNumber' => (int) $row->cycleNumber,
                    'tmtGolonganDasar' => $row->tmtGolonganDasar,
                    'eligibleDate' => $row->eligibleDate,
                    'status'     => (bool) $row->status,
                    'processedAt' => $row->processedAt,
                ];
            })
            ->all();

        $paginated = new LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        return response()->json([
            'data' => $items,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function updateProcessStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => ['required', 'boolean'],
        ]);

        $result = DB::transaction(function () use ($id, $validated) {
            $statusItem = KarirStatusProses::query()->lockForUpdate()->findOrFail($id);
            $pegawai = Pegawai::query()->findOrFail($statusItem->nipPegawai);
            $sudahDiprosesBefore = (bool) $statusItem->status === true;

            $today = Carbon::today()->toDateString();

            $statusItem->status = $validated['status'];
            $statusItem->processedAt = $validated['status'] ? $today : null;
            $statusItem->save();

            // Hanya naik pangkat jika baru pertama kali diproses (bukan update ulang)
            if ($validated['status'] === true && !$sudahDiprosesBefore) {
                // Ambil riwayat pangkat terakhir
                $latestRiwayat = RiwayatPangkat::query()
                    ->where('nipRiwayat', $statusItem->nipPegawai)
                    ->orderByDesc('tmtPangkat')
                    ->first();

                // Cari pangkat saat ini dari riwayat, atau dari kolom golongan di Pegawai
                $currentPangkat = $latestRiwayat
                    ? Pangkat::query()->find($latestRiwayat->idPangkatRiwayat)
                    : Pangkat::query()
                        ->whereRaw("CONCAT(pangkat, ' (', golongan, '/', ruang, ')') = ?", [$pegawai->golongan])
                        ->first();

                if (!$currentPangkat) {
                    return ['statusItem' => $statusItem, 'golongan' => $pegawai->golongan, 'naik' => false];
                }

                $nextPangkat = Pangkat::query()
                    ->where('urutan', $currentPangkat->urutan + 1)
                    ->first();

                // Sudah di pangkat tertinggi, tidak perlu naik
                if (!$nextPangkat) {
                    return ['statusItem' => $statusItem, 'golongan' => $pegawai->golongan, 'naik' => false];
                }

                // Tutup riwayat lama
                if ($latestRiwayat) {
                    $latestRiwayat->tmtSelesai = $today;
                    $latestRiwayat->status = false;
                    $latestRiwayat->save();
                }

                // Buat riwayat pangkat baru
                RiwayatPangkat::create([
                    'nipRiwayat'       => $statusItem->nipPegawai,
                    'idPangkatRiwayat' => $nextPangkat->idPangkat,
                    'tmtPangkat'       => $today,
                    'tmtSelesai'       => null,
                    'status'           => true,
                ]);

                // Update kolom golongan di Pegawai
                $newGolongan = sprintf('%s (%s/%s)', $nextPangkat->pangkat, $nextPangkat->golongan, $nextPangkat->ruang);
                $pegawai->golongan = $newGolongan;
                $pegawai->save();

                return ['statusItem' => $statusItem, 'golongan' => $newGolongan, 'naik' => true];
            }

            // Jika kembali ke false, ambil golongan terkini dari DB
            $pegawai->refresh();
            return ['statusItem' => $statusItem, 'golongan' => $pegawai->golongan, 'naik' => false];
        });

        return response()->json([
            'id'         => $result['statusItem']->id,
            'nipPegawai' => $result['statusItem']->nipPegawai,
            'cycleNumber' => (int) $result['statusItem']->cycleNumber,
            'tmtGolonganDasar' => optional($result['statusItem']->tmtGolonganDasar)->toDateString(),
            'eligibleDate' => optional($result['statusItem']->eligibleDate)->toDateString(),
            'status'     => (bool) $result['statusItem']->status,
            'golongan'   => $result['golongan'],
            'naik'       => $result['naik'],
            'processedAt' => optional($result['statusItem']->processedAt)->toDateString(),
        ]);
    }

    public function syncProcessStatuses(Request $request)
    {
        $pendidikan = $this->normalisasiPendidikan((string) $request->query('default_pendidikan', 'S1'));
        $maxRankOrder = $this->golonganOrder(self::BATAS_PANGKAT_PENDIDIKAN[$pendidikan] ?? 'Pembina (IV/a)');
        $summary = $this->ensureCurrentPromotionCycles($request, $maxRankOrder);

        return response()->json([
            'created' => $summary['created'],
            'updated' => $summary['updated'],
            'message' => sprintf(
                'Sinkronisasi selesai. %d siklus baru dibuat, %d data lama diperbarui.',
                $summary['created'],
                $summary['updated']
            ),
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
            fputcsv($out, ['NIP', 'Nama', 'Jabatan', 'Golongan', 'TMT Golongan', 'Lama Kerja Golongan (Tahun)', 'Lama Kerja Golongan (Bulan)', 'Layak Sejak']);

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
            fputcsv($out, ['NIP', 'Nama', 'Jabatan', 'Golongan', 'Tanggal Masuk', 'Lama Kerja (Tahun)', 'Lama Kerja (Bulan)', 'Status Satyalancana', 'Kategori']);

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

    private function promotionBaseQuery(Request $request, int $maxRankOrder, bool $applySearch = true): Builder
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
            ->whereNotExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('KarirStatusProses as ks')
                    ->whereColumn('ks.nipPegawai', 'b.nipPegawai')
                    ->whereRaw("ks.\"eligibleDate\" = (b.\"tmtGolonganAktif\"::date + interval '4 years')::date")
                    ->where('ks.status', true);
            })
            ->where(function ($sub) use ($maxRankOrder) {
                $sub->where('b.rankOrder', 0)
                    ->orWhere('b.rankOrder', '<', $maxRankOrder);
            });

        if ($applySearch && $q !== '') {
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
            ->selectRaw('rp."nipRiwayat", MAX(rp."idRiwayat") as latest_id')
            ->groupBy('rp.nipRiwayat');

        $statusRaw = "LOWER(COALESCE(NULLIF(TRIM(p.\"status\"), ''), NULLIF(TRIM(k.\"statusPegawai\"), ''), 'aktif'))";

        return DB::table('Pegawai as p')
            ->leftJoin('Kepegawaian as k', 'k.nipKepegawaian', '=', 'p.nipPegawai')
            ->leftJoinSub($latestRankSub, 'lr', function ($join) {
                $join->on('lr.nipRiwayat', '=', 'p.nipPegawai');
            })
            ->leftJoin('RiwayatPangkat as rp', function ($join) {
                $join->on('rp.idRiwayat', '=', 'lr.latest_id');
            })
            ->leftJoin('Pangkat as pg', 'pg.idPangkat', '=', 'rp.idPangkatRiwayat')
            ->select([
                'p.nipPegawai',
                'p.nama',
                'p.foto',
                'p.jabatan',
                DB::raw("COALESCE(CONCAT(pg.pangkat, ' (', pg.golongan, '/', pg.ruang, ')'), p.golongan) as golongan"),
                DB::raw("COALESCE(
                    rp.\"tmtPangkat\",
                    CASE LOWER(TRIM(k.\"statusPegawai\"))
                        WHEN 'pppk'    THEN k.\"tmtPppk\"
                        WHEN 'pns'     THEN COALESCE(k.\"tmtPns\", k.\"tmtCpns\")
                        WHEN 'non-asn' THEN p.\"tanggalMasuk\"
                        ELSE COALESCE(k.\"tmtPns\", k.\"tmtPppk\", k.\"tmtCpns\")
                    END,
                    p.\"tanggalMasuk\"
                ) as \"tmtGolonganAktif\""),
                DB::raw("COALESCE(p.\"tanggalMasuk\", k.\"tmtPns\", k.\"tmtPppk\", k.\"tmtCpns\") as \"tanggalMasuk\""),
                DB::raw($this->rankCaseExpression("COALESCE(CONCAT(pg.pangkat, ' (', pg.golongan, '/', pg.ruang, ')'), p.golongan)") . ' as "rankOrder"'),
            ])
            ->whereRaw($statusRaw . " NOT IN ('cuti','pensiun','nonaktif','resign')");
    }

    private function ensureCurrentPromotionCycles(Request $request, int $maxRankOrder): array
    {
        $q = trim((string) $request->query('q', ''));
        $baseRows = DB::query()->fromSub($this->pegawaiBaseQuery($request), 'b')
            ->select([
                'b.nipPegawai',
                'b.nama',
                'b.tmtGolonganAktif',
                'b.rankOrder',
            ])
            ->whereNotNull('b.tmtGolonganAktif')
            ->where(function ($sub) use ($maxRankOrder) {
                $sub->where('b.rankOrder', 0)
                    ->orWhere('b.rankOrder', '<', $maxRankOrder);
            });

        if ($q !== '') {
            $baseRows->where(function ($sub) use ($q) {
                $sub->where('b.nama', 'ilike', "%{$q}%")
                    ->orWhere('b.nipPegawai', 'ilike', "%{$q}%");
            });
        }

        $eligibleRows = $baseRows->get();
        $created = 0;
        $updated = 0;
        $today = Carbon::today();

        foreach ($eligibleRows as $row) {
            $tmtDasar = Carbon::parse($row->tmtGolonganAktif)->startOfDay();
            $nextCycleNumber = (int) KarirStatusProses::query()
                ->where('nipPegawai', $row->nipPegawai)
                ->max('cycleNumber');
            $legacyRows = KarirStatusProses::query()
                ->where('nipPegawai', $row->nipPegawai)
                ->whereNull('eligibleDate')
                ->orderBy('cycleNumber')
                ->get();
            $legacyIndex = 0;
            $cycleOffset = 1;

            while ($tmtDasar->copy()->addYears($cycleOffset * 4)->lte($today)) {
                $eligibleDate = $tmtDasar->copy()->addYears($cycleOffset * 4)->toDateString();

                $existingByEligibleDate = KarirStatusProses::query()
                    ->where('nipPegawai', $row->nipPegawai)
                    ->whereDate('eligibleDate', $eligibleDate)
                    ->first();

                if ($existingByEligibleDate) {
                    if (!$existingByEligibleDate->tmtGolonganDasar) {
                        $existingByEligibleDate->tmtGolonganDasar = $tmtDasar->toDateString();
                        $existingByEligibleDate->save();
                        $updated++;
                    }

                    $cycleOffset++;
                    continue;
                }

                $legacyRow = $legacyRows[$legacyIndex] ?? null;

                if ($legacyRow) {
                    $legacyRow->tmtGolonganDasar = $tmtDasar->toDateString();
                    $legacyRow->eligibleDate = $eligibleDate;
                    $legacyRow->save();
                    $updated++;
                    $legacyIndex++;
                    $cycleOffset++;
                    continue;
                }

                KarirStatusProses::query()->create([
                    'nipPegawai' => $row->nipPegawai,
                    'cycleNumber' => $nextCycleNumber + 1,
                    'tmtGolonganDasar' => $tmtDasar->toDateString(),
                    'eligibleDate' => $eligibleDate,
                    'status' => false,
                    'processedAt' => null,
                ]);
                $created++;
                $nextCycleNumber++;
                $cycleOffset++;
            }
        }

        return [
            'created' => $created,
            'updated' => $updated,
        ];
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

    private function normalizeCareerItem(object $item): array
    {
        $data = (array) $item;

        if (!empty($data['foto'])) {
            $data['foto'] = $this->normalizeFilePath($data['foto']);
        }

        if (empty($data['statusProses'])) {
            $data['statusProses'] = 'blm';
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
