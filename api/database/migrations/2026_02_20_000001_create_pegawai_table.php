<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Pegawai', function (Blueprint $table) {
            $table->char('nipPegawai', 18)->primary();
            $table->string('nama', 150);
            $table->string('gelarDepan', 50)->nullable();
            $table->string('gelarBelakang', 50)->nullable();
            $table->string('tempatLahir', 100);
            $table->date('tanggalLahir');
            $table->string('jenisKelamin', 10);
            $table->string('agama', 20)->nullable();
            $table->text('alamat')->nullable();
            $table->string('email', 120)->nullable()->unique();
            $table->string('noHp', 20);
            $table->string('foto', 255)->default('');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Pegawai');
    }
};
