<?php

namespace Database\Seeders;

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

        $agamaList = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha'];
        $kotaList = ['Samarinda', 'Balikpapan', 'Bontang', 'Tenggarong', 'Berau'];
        $statusList = ['Aktif', 'Aktif', 'Aktif', 'Cuti'];
        $jenisPegawaiList = ['PNS', 'PPPK'];

        $dummyRows = [];

        for ($i = 1; $i <= 50; $i++) {
            $month = (($i - 1) % 12) + 1;
            $day = (($i - 1) % 28) + 1;
            $nip = sprintf('1985%02d%02d%010d', $month, $day, $i);
            $email = sprintf('pegawai.dummy%02d@simpeg.test', $i);
            $gender = $i % 2 === 0 ? 'Perempuan' : 'Laki-laki';
            $statusPegawai = $statusList[$i % count($statusList)];
            $jenisPegawai = $jenisPegawaiList[$i % count($jenisPegawaiList)];
            $departemen = $departemenList[$i % count($departemenList)];
            $jabatan = $jabatanList[$i % count($jabatanList)];
            $tempatLahir = $kotaList[$i % count($kotaList)];
            $agama = $agamaList[$i % count($agamaList)];
            $tanggalLahir = sprintf('%04d-%02d-%02d', 1980 + ($i % 15), $month, $day);
            $tanggalMasuk = sprintf('%04d-%02d-%02d', 2008 + ($i % 12), (($i + 2) % 12) + 1, (($i + 7) % 28) + 1);
            $tmtCpns = sprintf('%04d-%02d-%02d', 2009 + ($i % 10), (($i + 3) % 12) + 1, (($i + 5) % 28) + 1);
            $tmtPns = sprintf('%04d-%02d-%02d', 2010 + ($i % 10), (($i + 4) % 12) + 1, (($i + 8) % 28) + 1);
            $masaKerjaTahun = 4 + ($i % 20);
            $masaKerjaBulan = $i % 12;

            $pangkat = $pangkatList[$i % $pangkatList->count()];
            $golongan = sprintf('%s (%s/%s)', $pangkat->pangkat, $pangkat->golongan, $pangkat->ruang);

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
                    'status' => $statusPegawai,
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
                    'masaKerjaTahun' => $masaKerjaTahun,
                    'masaKerjaBulan' => $masaKerjaBulan,
                ],
                'riwayat' => [
                    'nipRiwayat' => $nip,
                    'idPangkatRiwayat' => $pangkat->idPangkat,
                    'tmtPangkat' => sprintf('%04d-%02d-%02d', 2020 + ($i % 5), (($i + 1) % 12) + 1, (($i + 10) % 28) + 1),
                    'tmtSelesai' => null,
                    'status' => true,
                ],
            ];
        }

        DB::transaction(function () use ($dummyRows) {
            $dummyNips = array_column($dummyRows, 'nip');

            DB::table('RiwayatPangkat')->whereIn('nipRiwayat', $dummyNips)->delete();

            foreach ($dummyRows as $row) {
                DB::table('Pegawai')->updateOrInsert(
                    ['nipPegawai' => $row['pegawai']['nipPegawai']],
                    $row['pegawai']
                );

                DB::table('IdentitasResmi')->updateOrInsert(
                    ['nipIdResmi' => $row['identitas']['nipIdResmi']],
                    $row['identitas']
                );

                DB::table('Kepegawaian')->updateOrInsert(
                    ['nipKepegawaian' => $row['kepegawaian']['nipKepegawaian']],
                    $row['kepegawaian']
                );

                DB::table('RiwayatPangkat')->insert($row['riwayat']);
            }
        });
    }
}
