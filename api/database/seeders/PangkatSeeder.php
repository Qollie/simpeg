<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PangkatSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('Pangkat')->truncate();

        DB::table('Pangkat')->insert([
            ['pangkat' => 'Juru Muda', 'golongan' => 'I', 'ruang' => 'a', 'urutan' => 1],
            ['pangkat' => 'Juru Muda Tingkat I', 'golongan' => 'I', 'ruang' => 'b', 'urutan' => 2],
            ['pangkat' => 'Juru', 'golongan' => 'I', 'ruang' => 'c', 'urutan' => 3],
            ['pangkat' => 'Juru Tingkat I', 'golongan' => 'I', 'ruang' => 'd', 'urutan' => 4],
            ['pangkat' => 'Pengatur Muda', 'golongan' => 'II', 'ruang' => 'a', 'urutan' => 5],
            ['pangkat' => 'Pengatur Muda Tingkat I', 'golongan' => 'II', 'ruang' => 'b', 'urutan' => 6],
            ['pangkat' => 'Pengatur', 'golongan' => 'II', 'ruang' => 'c', 'urutan' => 7],
            ['pangkat' => 'Pengatur Tingkat I', 'golongan' => 'II', 'ruang' => 'd', 'urutan' => 8],
            ['pangkat' => 'Penata Muda', 'golongan' => 'III', 'ruang' => 'a', 'urutan' => 9],
            ['pangkat' => 'Penata Muda Tingkat I', 'golongan' => 'III', 'ruang' => 'b', 'urutan' => 10],
            ['pangkat' => 'Penata', 'golongan' => 'III', 'ruang' => 'c', 'urutan' => 11],
            ['pangkat' => 'Penata Tingkat I', 'golongan' => 'III', 'ruang' => 'd', 'urutan' => 12],
            ['pangkat' => 'Pembina', 'golongan' => 'IV', 'ruang' => 'a', 'urutan' => 13],
            ['pangkat' => 'Pembina Tingkat I', 'golongan' => 'IV', 'ruang' => 'b', 'urutan' => 14],
            ['pangkat' => 'Pembina Utama Muda', 'golongan' => 'IV', 'ruang' => 'c', 'urutan' => 15],
            ['pangkat' => 'Pembina Utama Madya', 'golongan' => 'IV', 'ruang' => 'd', 'urutan' => 16],
            ['pangkat' => 'Pembina Utama', 'golongan' => 'IV', 'ruang' => 'e', 'urutan' => 17],
        ]);
    }
}
