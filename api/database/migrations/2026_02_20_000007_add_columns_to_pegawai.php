<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('Pegawai', function (Blueprint $table) {
            $table->string('jabatan', 150)->nullable();
            $table->string('departemen', 150)->nullable();
            $table->string('golongan', 100)->nullable();
            $table->string('status', 20)->default('Aktif');
            $table->date('tanggalMasuk')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('Pegawai', function (Blueprint $table) {
            $table->dropColumn(['jabatan', 'departemen', 'golongan', 'status', 'tanggalMasuk']);
        });
    }
};
