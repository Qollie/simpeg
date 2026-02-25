<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PegawaiSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('Pegawai')->upsert([
            [
                'nipPegawai' => '198765432100000001',
                'nama' => 'Budi Santoso',
                'gelarDepan' => null,
                'gelarBelakang' => 'S.Kom',
                'tempatLahir' => 'Samarinda',
                'tanggalLahir' => '1990-05-12',
                'jenisKelamin' => 'Laki-laki',
                'agama' => 'Islam',
                'alamat' => 'Jl. Merdeka No.1',
                'email' => 'budi@example.test',
                'noHp' => '081234567890',
                'foto' => '',
                'jabatan' => 'Staff',
                'departemen' => 'Pelayanan Pendaftaran Penduduk',
                'golongan' => 'Pengatur (II/c)',
                'status' => 'Aktif',
                'tanggalMasuk' => '2015-02-01',
            ],
            [
                'nipPegawai' => '198765432100000002',
                'nama' => 'Siti Aminah',
                'gelarDepan' => null,
                'gelarBelakang' => null,
                'tempatLahir' => 'Balikpapan',
                'tanggalLahir' => '1988-11-02',
                'jenisKelamin' => 'Perempuan',
                'agama' => 'Kristen',
                'alamat' => 'Jl. Pahlawan No.2',
                'email' => 'siti@example.test',
                'noHp' => '089876543210',
                'foto' => '',
                'jabatan' => 'Kepala Bidang',
                'departemen' => 'Pelayanan Pencatatan Sipil',
                'golongan' => 'Penata Muda (III/a)',
                'status' => 'Cuti',
                'tanggalMasuk' => '2012-06-15',
            ],
        ], ['nipPegawai']);
    }
}
