<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('IdentitasResmi', function (Blueprint $table) {
            $table->char('nipIdResmi', 18)->primary();
            $table->char('nik', 16);
            $table->string('noBpjs', 20)->nullable();
            $table->string('noNpwp', 25)->nullable();
            $table->string('karpeg', 30)->nullable();
            $table->string('karsuKarsi', 30)->nullable();
            $table->string('taspen', 30)->nullable();

            $table->foreign('nipIdResmi')->references('nipPegawai')->on('Pegawai');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('IdentitasResmi');
    }
};
