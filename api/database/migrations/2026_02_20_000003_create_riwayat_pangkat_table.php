<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('RiwayatPangkat')) {
            return;
        }

        Schema::create('RiwayatPangkat', function (Blueprint $table) {
            $table->increments('idRiwayat');
            $table->char('nipRiwayat', 18);
            $table->integer('idPangkatRiwayat')->unsigned();
            $table->date('tmtPangkat');
            $table->date('tmtSelesai')->nullable();
            $table->boolean('status');

            $table->foreign('nipRiwayat')->references('nipPegawai')->on('Pegawai');
            $table->foreign('idPangkatRiwayat')->references('idPangkat')->on('Pangkat');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('RiwayatPangkat');
    }
};
