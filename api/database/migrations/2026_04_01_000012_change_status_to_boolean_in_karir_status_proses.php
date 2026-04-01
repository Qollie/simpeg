<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Harus drop default dulu sebelum ubah tipe, karena default 'blm' tidak bisa di-cast ke boolean
        DB::statement('ALTER TABLE "KarirStatusProses" ALTER COLUMN "status" DROP DEFAULT');
        DB::statement('ALTER TABLE "KarirStatusProses" ALTER COLUMN "status" TYPE boolean USING (status = \'sdh diproses\')');
        DB::statement('ALTER TABLE "KarirStatusProses" ALTER COLUMN "status" SET DEFAULT false');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE "KarirStatusProses" ALTER COLUMN "status" DROP DEFAULT');
        DB::statement('ALTER TABLE "KarirStatusProses" ALTER COLUMN "status" TYPE varchar(20) USING (CASE WHEN status = true THEN \'sdh diproses\' ELSE \'blm\' END)');
        DB::statement('ALTER TABLE "KarirStatusProses" ALTER COLUMN "status" SET DEFAULT \'blm\'');
    }
};
