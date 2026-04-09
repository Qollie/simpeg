<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KarirStatusProses;
use App\Models\Kepegawaian;
use App\Models\Pangkat;
use App\Models\Pegawai;
use App\Models\RiwayatPangkat;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
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

        // Subquery: untuk tiap pegawai, cari cycleNumber pertama yang belum diproses
        $firstPendingSub = DB::table('KarirStatusProses')
            ->selectRaw('"nipPegawai", MIN("cycleNumber") as first_pending_cycle')
            ->whereNotNull('eligibleDate')
            ->where('status', false)
            ->groupBy('nipPegawai');

        // Subquery pegawai: hanya ambil nama & golongan (lebih ringan dari pegawaiBaseQuery)
        $latestRankSub = DB::table('RiwayatPangkat as rp')
            ->selectRaw('rp."nipRiwayat", MAX(rp."idRiwayat") as latest_id')
            ->groupBy('rp.nipRiwayat');

        $pegawaiSub = DB::table('Pegawai as p')
            ->leftJoin('Kepegawaian as k', 'k.nipKepegawaian', '=', 'p.nipPegawai')
            ->leftJoinSub($latestRankSub, 'lr', 'lr.nipRiwayat', '=', 'p.nipPegawai')
            ->leftJoin('RiwayatPangkat as rp', 'rp.idRiwayat', '=', 'lr.latest_id')
            ->leftJoin('Pangkat as pg', 'pg.idPangkat', '=', 'rp.idPangkatRiwayat')
            ->select([
                'p.nipPegawai',
                'p.nama',
                DB::raw("COALESCE(pg.pangkat || ' (' || pg.golongan || '/' || pg.ruang || ')', p.golongan) as golongan"),
            ])
            ->whereRaw("LOWER(COALESCE(NULLIF(TRIM(p.\"status\"), ''), NULLIF(TRIM(k.\"statusPegawai\"), ''), 'aktif')) NOT IN ('cuti','pensiun','nonaktif','resign')")
            ->whereRaw("LOWER(TRIM(COALESCE(k.\"statusPegawai\", ''))) = 'pns'");

        $query = DB::table('KarirStatusProses as ks')
            ->joinSub($pegawaiSub, 'b', 'b.nipPegawai', '=', 'ks.nipPegawai')
            ->leftJoinSub($firstPendingSub, 'pm', 'pm.nipPegawai', '=', 'ks.nipPegawai')
            ->select([
                'ks.id',
                'ks.nipPegawai',
                'b.nama',
                'b.golongan',
                'ks.cycleNumber',
                'ks.tmtGolonganDasar',
                'ks.eligibleDate',
                // Prioritas: kolom baru → fallback scalar subquery dari RiwayatPangkat yang ditutup (LIMIT 1 agar tidak duplikat)
                DB::raw('COALESCE(ks."golonganSebelum", (
                    SELECT pg_hist.pangkat || \' (\' || pg_hist.golongan || \'/\' || pg_hist.ruang || \')\'
                    FROM "RiwayatPangkat" rp_hist
                    JOIN "Pangkat" pg_hist ON pg_hist."idPangkat" = rp_hist."idPangkatRiwayat"
                    WHERE rp_hist."nipRiwayat" = ks."nipPegawai"
                      AND rp_hist."tmtSelesai" = ks."processedAt"
                      AND rp_hist.status = false
                      AND rp_hist."tmtSelesai" IS NOT NULL
                    ORDER BY rp_hist."idRiwayat" DESC
                    LIMIT 1
                )) as "golonganSebelum"'),
                'ks.status',
                'ks.processedAt',
            ])
            ->whereNotNull('ks.eligibleDate')
            // Tampilkan siklus s.d. siklus pertama yang belum diproses; jika semua sudah diproses tampilkan semuanya
            ->whereRaw('ks."cycleNumber" <= COALESCE(pm.first_pending_cycle, ks."cycleNumber")');

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('b.nama', 'ilike', "%{$q}%")
                    ->orWhere('ks.nipPegawai', 'ilike', "%{$q}%");
            });
        }

        $paginated = $query
            ->orderByDesc('ks.eligibleDate')
            ->orderByDesc('ks.cycleNumber')
            ->orderBy('b.nama')
            ->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginated->items())->map(fn ($row) => [
            'id'               => $row->id,
            'nipPegawai'       => $row->nipPegawai,
            'nama'             => $row->nama,
            'golongan'         => $row->golongan,
            'golonganSebelum'  => $row->golonganSebelum ?? null,
            'cycleNumber'      => (int) $row->cycleNumber,
            'tmtGolonganDasar' => $row->tmtGolonganDasar,
            'eligibleDate'     => $row->eligibleDate,
            'status'           => (bool) $row->status,
            'processedAt'      => $row->processedAt,
        ])->all();

        return response()->json([
            'data'         => $items,
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'per_page'     => $paginated->perPage(),
            'total'        => $paginated->total(),
        ]);
    }

    public function updateProcessStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => ['required', 'boolean'],
        ]);

        // PPPK dan Non-ASN tidak memiliki sistem kenaikan pangkat
        $statusItemCheck = KarirStatusProses::query()->findOrFail($id);
        $kepegawaianCheck = Kepegawaian::query()->where('nipKepegawaian', $statusItemCheck->nipPegawai)->first();
        if (strtolower(trim($kepegawaianCheck->statusPegawai ?? '')) !== 'pns') {
            return response()->json([
                'message' => 'Kenaikan pangkat hanya berlaku untuk pegawai berstatus PNS.',
            ], 422);
        }

        $result = DB::transaction(function () use ($id, $validated) {
            $statusItem = KarirStatusProses::query()->lockForUpdate()->findOrFail($id);
            $pegawai = Pegawai::query()->findOrFail($statusItem->nipPegawai);
            $sudahDiprosesBefore = (bool) $statusItem->status === true;

            $today = Carbon::today()->toDateString();

            $statusItem->status = $validated['status'];
            $statusItem->processedAt = $validated['status'] ? $today : null;
            // save() dipanggil setelah golonganSebelum diisi di blok promosi

            // Hanya naik pangkat jika baru pertama kali diproses (bukan update ulang)
            if ($validated['status'] === true && !$sudahDiprosesBefore) {
                // Ambil riwayat pangkat terakhir (pakai idRiwayat agar tetap deterministik
                // meski beberapa siklus diproses pada hari yang sama)
                $latestRiwayat = RiwayatPangkat::query()
                    ->where('nipRiwayat', $statusItem->nipPegawai)
                    ->orderByDesc('idRiwayat')
                    ->first();

                // Cari pangkat saat ini dari riwayat, atau dari kolom golongan di Pegawai.
                // Gunakan || (bukan CONCAT) agar lookup konsisten dengan format penyimpanan.
                $currentPangkat = $latestRiwayat
                    ? Pangkat::query()->find($latestRiwayat->idPangkatRiwayat)
                    : Pangkat::query()
                        ->whereRaw("pangkat || ' (' || golongan || '/' || ruang || ')' = ?", [$pegawai->golongan])
                        ->first();

                if (!$currentPangkat) {
                    $statusItem->save();
                    return ['statusItem' => $statusItem, 'golongan' => $pegawai->golongan, 'naik' => false];
                }

                // Simpan pangkat sebelum promosi sebagai histori
                $statusItem->golonganSebelum = sprintf(
                    '%s (%s/%s)',
                    $currentPangkat->pangkat,
                    $currentPangkat->golongan,
                    $currentPangkat->ruang
                );

                $nextPangkat = Pangkat::query()
                    ->where('urutan', $currentPangkat->urutan + 1)
                    ->first();

                // Sudah di pangkat tertinggi, tidak perlu naik
                if (!$nextPangkat) {
                    $statusItem->save();
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

                // Simpan statusItem setelah semua field siap
                $statusItem->save();

                return ['statusItem' => $statusItem, 'golongan' => $newGolongan, 'naik' => true];
            }

            // Jika kembali ke false, bersihkan golonganSebelum dan simpan
            $statusItem->golonganSebelum = null;
            $statusItem->save();
            $pegawai->refresh();
            return ['statusItem' => $statusItem, 'golongan' => $pegawai->golongan, 'naik' => false];
        });

        return response()->json([
            'id'              => $result['statusItem']->id,
            'nipPegawai'      => $result['statusItem']->nipPegawai,
            'cycleNumber'     => (int) $result['statusItem']->cycleNumber,
            'tmtGolonganDasar' => optional($result['statusItem']->tmtGolonganDasar)->toDateString(),
            'eligibleDate'    => optional($result['statusItem']->eligibleDate)->toDateString(),
            'golonganSebelum' => $result['statusItem']->golonganSebelum,
            'status'          => (bool) $result['statusItem']->status,
            'golongan'        => $result['golongan'],
            'naik'            => $result['naik'],
            'processedAt'     => optional($result['statusItem']->processedAt)->toDateString(),
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
                // Masa kerja dihitung dari tmtGolonganDasar siklus tertunggak jika ada,
                // fallback ke tmtGolonganAktif saat ini (untuk pegawai yang belum pernah diproses).
                DB::raw("EXTRACT(YEAR FROM age(CURRENT_DATE, COALESCE(
                    (SELECT ks_mk.\"tmtGolonganDasar\" FROM \"KarirStatusProses\" ks_mk
                     WHERE ks_mk.\"nipPegawai\" = b.\"nipPegawai\"
                       AND ks_mk.status = false
                       AND ks_mk.\"eligibleDate\" IS NOT NULL
                       AND ks_mk.\"eligibleDate\"::date <= CURRENT_DATE
                       AND ks_mk.\"tmtGolonganDasar\" IS NOT NULL
                     ORDER BY ks_mk.\"eligibleDate\" ASC
                     LIMIT 1),
                    b.\"tmtGolonganAktif\"
                )::date))::int as \"masaKerjaGolonganTahun\""),
                DB::raw("EXTRACT(MONTH FROM age(CURRENT_DATE, COALESCE(
                    (SELECT ks_mk.\"tmtGolonganDasar\" FROM \"KarirStatusProses\" ks_mk
                     WHERE ks_mk.\"nipPegawai\" = b.\"nipPegawai\"
                       AND ks_mk.status = false
                       AND ks_mk.\"eligibleDate\" IS NOT NULL
                       AND ks_mk.\"eligibleDate\"::date <= CURRENT_DATE
                       AND ks_mk.\"tmtGolonganDasar\" IS NOT NULL
                     ORDER BY ks_mk.\"eligibleDate\" ASC
                     LIMIT 1),
                    b.\"tmtGolonganAktif\"
                )::date))::int as \"masaKerjaGolonganBulan\""),
                // Prioritas: tanggal layak dari KarirStatusProses yang belum diproses (siklus tertunggak),
                // fallback ke kalkulasi tmtGolonganAktif + 4 tahun untuk pegawai baru masuk daftar.
                DB::raw("COALESCE(
                    (SELECT MIN(ks_ed.\"eligibleDate\") FROM \"KarirStatusProses\" ks_ed
                     WHERE ks_ed.\"nipPegawai\" = b.\"nipPegawai\"
                       AND ks_ed.status = false
                       AND ks_ed.\"eligibleDate\" IS NOT NULL
                       AND ks_ed.\"eligibleDate\"::date <= CURRENT_DATE),
                    (b.\"tmtGolonganAktif\"::date + interval '4 years')::date
                ) as \"eligibleDate\""),
            ])
            ->where('b.statusPegawai', 'pns')
            ->whereNotNull('b.tmtGolonganAktif')
            ->where(function ($outer) {
                // Kondisi 1: berdasarkan tmtGolonganAktif saat ini (belum ada siklus yang diproses untuk tanggal ini)
                $outer->where(function ($inner) {
                    $inner->whereRaw("(b.\"tmtGolonganAktif\"::date + interval '4 years')::date <= CURRENT_DATE")
                          ->whereNotExists(function ($sub) {
                              $sub->select(DB::raw(1))
                                  ->from('KarirStatusProses as ks')
                                  ->whereColumn('ks.nipPegawai', 'b.nipPegawai')
                                  ->whereRaw("ks.\"eligibleDate\" = (b.\"tmtGolonganAktif\"::date + interval '4 years')::date")
                                  ->where('ks.status', true);
                          });
                })
                // Kondisi 2: ada siklus KarirStatusProses yang belum diproses dengan eligibleDate sudah lewat
                // (terjadi ketika tmtGolonganAktif diperbarui setelah siklus sebelumnya diproses,
                //  sehingga siklus lama yang tertunggak tidak terdeteksi dari tmtGolonganAktif baru)
                ->orWhereExists(function ($sub) {
                    $sub->select(DB::raw(1))
                        ->from('KarirStatusProses as ks_pending')
                        ->whereColumn('ks_pending.nipPegawai', 'b.nipPegawai')
                        ->where('ks_pending.status', false)
                        ->whereNotNull('ks_pending.eligibleDate')
                        ->whereRaw('ks_pending."eligibleDate"::date <= CURRENT_DATE');
                });
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
            // Non-ASN tidak berhak atas Satyalancana Karya Satya (bukan bagian ASN formal)
            // PNS dan PPPK sama-sama berhak (PPPK adalah ASN per UU No. 5/2014)
            ->where('b.statusPegawai', '<>', 'non-asn')
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
                // Gunakan || (bukan CONCAT) agar NULL dari LEFT JOIN tetap NULL,
                // sehingga COALESCE bisa fallback ke p.golongan dengan benar.
                // CONCAT(NULL,...) = ' (/'  → COALESCE salah pilih nilai kosong.
                // NULL || ...     = NULL   → COALESCE benar fallback ke p.golongan.
                DB::raw("COALESCE(pg.pangkat || ' (' || pg.golongan || '/' || pg.ruang || ')', p.golongan) as golongan"),
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
                DB::raw($this->rankCaseExpression("COALESCE(pg.pangkat || ' (' || pg.golongan || '/' || pg.ruang || ')', p.golongan)") . ' as "rankOrder"'),
                DB::raw("LOWER(TRIM(COALESCE(k.\"statusPegawai\", ''))) as \"statusPegawai\""),
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
            ->where('b.statusPegawai', 'pns')
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
