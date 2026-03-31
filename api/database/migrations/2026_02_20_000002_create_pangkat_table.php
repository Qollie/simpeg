<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('Pangkat')) {
            return;
        }

        Schema::create('Pangkat', function (Blueprint $table) {
            $table->increments('idPangkat');
            $table->string('pangkat', 50);
            $table->string('golongan', 5);
            $table->string('ruang', 1);
            $table->integer('urutan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Pangkat');
    }
};
