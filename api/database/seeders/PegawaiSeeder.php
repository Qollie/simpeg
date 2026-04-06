<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PegawaiSeeder extends Seeder
{
    public function run(): void
    {
        $faker = fake('id_ID');
        $pangkatList = DB::table('Pangkat')
            ->select('idPangkat', 'pangkat', 'golongan', 'ruang', 'urutan')
            ->orderBy('urutan')
            ->get();

        if ($pangkatList->isEmpty()) {
            throw new \RuntimeException('Seeder Pangkat harus dijalankan lebih dulu.');
        }

        $departemenList = [
            'Pelayanan Pendaftaran Penduduk',
            'Pelayanan Pencatatan Sipil',
            'Pengelolaan Informasi Administrasi Kependudukan',
            'Pemanfaatan Data dan Inovasi Pelayanan',
            'Sekretariat',
        ];

        $jabatanList = [
            'Analis Kepegawaian',
            'Pengelola Data',
            'Operator Pelayanan',
            'Verifikator Dokumen',
            'Arsiparis',
            'Kepala Sub Bagian',
            'Admin Sistem',
            'Petugas Front Office',
        ];

        $agamaList = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha'];
        $kotaList = ['Samarinda', 'Balikpapan', 'Bontang', 'Tenggarong', 'Berau'];
        $statusInternalList = ['Aktif', 'Aktif', 'Aktif', 'Cuti'];
        $statusPegawaiList = ['PNS', 'PPPK', 'Non-ASN'];
        $jenisPegawaiList = ['Tenaga Struktural', 'Tenaga Fungsional', 'Tenaga Administrasi'];

        $dummyRows = [];

        for ($i = 1; $i <= 36; $i++) {
            $month = (($i - 1) % 12) + 1;
            $day = (($i - 1) % 28) + 1;
            $nip = sprintf('1985%02d%02d%010d', $month, $day, $i);
            $email = sprintf('pegawai.dummy%02d@simpeg.test', $i);
            $gender = $i % 2 === 0 ? 'Perempuan' : 'Laki-laki';
            $statusInternal = $statusInternalList[$i % count($statusInternalList)];
            $statusPegawai = $statusPegawaiList[$i % count($statusPegawaiList)];
            $jenisPegawai = $jenisPegawaiList[$i % count($jenisPegawaiList)];
            $departemen = $departemenList[$i % count($departemenList)];
            $jabatan = $jabatanList[$i % count($jabatanList)];
            $tempatLahir = $kotaList[$i % count($kotaList)];
            $agama = $agamaList[$i % count($agamaList)];
            $tanggalLahir = sprintf('%04d-%02d-%02d', 1979 + ($i % 18), $month, $day);
            $tanggalMasuk = sprintf('%04d-%02d-%02d', 2007 + ($i % 11), (($i + 2) % 12) + 1, (($i + 7) % 28) + 1);
            $tmtCpns = $statusPegawai === 'PNS'
                ? sprintf('%04d-%02d-%02d', 2008 + ($i % 10), (($i + 3) % 12) + 1, (($i + 5) % 28) + 1)
                : null;
            $tmtPns = $statusPegawai === 'PNS'
                ? sprintf('%04d-%02d-%02d', 2009 + ($i % 10), (($i + 4) % 12) + 1, (($i + 8) % 28) + 1)
                : null;
            $tmtPppk = $statusPegawai === 'PPPK'
                ? sprintf('%04d-%02d-%02d', 2016 + ($i % 6), (($i + 1) % 12) + 1, (($i + 9) % 28) + 1)
                : null;
            $masaKerjaTahun = 4 + ($i % 20);
            $masaKerjaBulan = $i % 12;

            $pangkat = $pangkatList[$i % $pangkatList->count()];
            $golongan = sprintf('%s (%s/%s)', $pangkat->pangkat, $pangkat->golongan, $pangkat->ruang);
            $riwayatTmt = match ($i) {
                1, 2 => sprintf('2016-%02d-%02d', (($i + 1) % 12) + 1, (($i + 10) % 28) + 1),
                3, 4 => sprintf('2008-%02d-%02d', (($i + 1) % 12) + 1, (($i + 10) % 28) + 1),
                default => sprintf('%04d-%02d-%02d', 2019 + ($i % 6), (($i + 1) % 12) + 1, (($i + 10) % 28) + 1),
            };

            $dummyRows[] = [
                'nip' => $nip,
                'pegawai' => [
                    'nipPegawai' => $nip,
                    'nama' => $faker->name($gender === 'Laki-laki' ? 'male' : 'female'),
                    'gelarDepan' => null,
                    'gelarBelakang' => $i % 3 === 0 ? 'S.Kom' : ($i % 5 === 0 ? 'S.AP' : null),
                    'tempatLahir' => $tempatLahir,
                    'tanggalLahir' => $tanggalLahir,
                    'jenisKelamin' => $gender,
                    'agama' => $agama,
                    'alamat' => $faker->address(),
                    'email' => $email,
                    'noHp' => '08' . str_pad((string) (1111000000 + $i), 10, '0', STR_PAD_LEFT),
                    'foto' => '',
                    'jabatan' => $jabatan,
                    'departemen' => $departemen,
                    'golongan' => $golongan,
                    'status' => $statusInternal,
                    'tanggalMasuk' => $tanggalMasuk,
                ],
                'identitas' => [
                    'nipIdResmi' => $nip,
                    'nik' => str_pad((string) (6472000000000000 + $i), 16, '0', STR_PAD_LEFT),
                    'noBpjs' => '000' . str_pad((string) (9100000000 + $i), 10, '0', STR_PAD_LEFT),
                    'noNpwp' => sprintf('%02d.%03d.%03d.%1d-%03d.000', 10 + ($i % 80), 100 + $i, 200 + $i, $i % 9, 300 + $i),
                    'karpeg' => 'KPG' . str_pad((string) $i, 8, '0', STR_PAD_LEFT),
                    'karsuKarsi' => 'KSK' . str_pad((string) $i, 8, '0', STR_PAD_LEFT),
                    'taspen' => 'TSP' . str_pad((string) $i, 8, '0', STR_PAD_LEFT),
                ],
                'kepegawaian' => [
                    'nipKepegawaian' => $nip,
                    'statusPegawai' => $statusPegawai,
                    'jenisPegawai' => $jenisPegawai,
                    'tmtCpns' => $tmtCpns,
                    'tmtPns' => $tmtPns,
                    'tmtPppk' => $tmtPppk,
                    'masaKerjaTahun' => $masaKerjaTahun,
                    'masaKerjaBulan' => $masaKerjaBulan,
                ],
                'riwayat' => [
                    'nipRiwayat' => $nip,
                    'idPangkatRiwayat' => $pangkat->idPangkat,
                    'tmtPangkat' => $riwayatTmt,
                    'tmtSelesai' => null,
                    'status' => true,
                ],
            ];
        }

        DB::transaction(function () use ($dummyRows) {
            $dummyNips = array_column($dummyRows, 'nip');

            DB::table('KarirStatusProses')->delete();
            DB::table('RiwayatPangkat')->whereIn('nipRiwayat', $dummyNips)->delete();
            DB::table('Kepegawaian')->whereIn('nipKepegawaian', $dummyNips)->delete();
            DB::table('IdentitasResmi')->whereIn('nipIdResmi', $dummyNips)->delete();
            DB::table('Pegawai')->whereIn('nipPegawai', $dummyNips)->delete();

            foreach ($dummyRows as $row) {
                DB::table('Pegawai')->insert($row['pegawai']);
                DB::table('IdentitasResmi')->insert($row['identitas']);
                DB::table('Kepegawaian')->insert($row['kepegawaian']);
                DB::table('RiwayatPangkat')->insert($row['riwayat']);
            }

            $multiCycleMap = [
                $dummyRows[0]['nip'] => 2,
                $dummyRows[1]['nip'] => 2,
                $dummyRows[2]['nip'] => 4,
                $dummyRows[3]['nip'] => 4,
            ];

            foreach ($dummyRows as $row) {
                $nip = $row['nip'];
                $cycleTotal = $multiCycleMap[$nip] ?? 1;
                $tmtDasar = Carbon::parse($row['riwayat']['tmtPangkat']);

                for ($cycle = 1; $cycle <= $cycleTotal; $cycle++) {
                    $eligibleDate = $tmtDasar->copy()->addYears($cycle * 4)->toDateString();

                    if ($eligibleDate > Carbon::today()->toDateString()) {
                        continue;
                    }

                    DB::table('KarirStatusProses')->insert([
                        'nipPegawai' => $nip,
                        'cycleNumber' => $cycle,
                        'tmtGolonganDasar' => $tmtDasar->toDateString(),
                        'eligibleDate' => $eligibleDate,
                        'status' => false,
                        'processedAt' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        });
    }
}
