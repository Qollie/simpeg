<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Kepegawaian', function (Blueprint $table) {
            $table->char('nipKepegawaian', 18)->primary();
            $table->string('statusPegawai', 20);
            $table->string('jenisPegawai', 50);
            $table->date('tmtCpns')->nullable();
            $table->date('tmtPns')->nullable();
            $table->integer('masaKerjaTahun');
            $table->integer('masaKerjaBulan');

            $table->foreign('nipKepegawaian')->references('nipPegawai')->on('Pegawai');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Kepegawaian');
    }
};
