<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('KarirStatusProses', function (Blueprint $table) {
            $table->id();
            $table->char('nipPegawai', 18)->unique();
            $table->string('status', 20)->default('blm');
            $table->timestamps();

            $table->foreign('nipPegawai')->references('nipPegawai')->on('Pegawai')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('KarirStatusProses');
    }
};
