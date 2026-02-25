<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('EfilePegawai', function (Blueprint $table) {
            $table->increments('idFile');
            $table->char('nipEfile', 18);
            $table->string('jenisDokumen', 30);
            $table->string('namaFile', 255);
            $table->string('filePath', 255);
            $table->timestampTz('waktuUpload');

            $table->foreign('nipEfile')->references('nipPegawai')->on('Pegawai');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('EfilePegawai');
    }
};
