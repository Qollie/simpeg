<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('Pegawai')) {
            return;
        }

        Schema::table('Pegawai', function (Blueprint $table) {
            if (!Schema::hasColumn('Pegawai', 'jabatan')) {
                $table->string('jabatan', 150)->nullable();
            }

            if (!Schema::hasColumn('Pegawai', 'departemen')) {
                $table->string('departemen', 150)->nullable();
            }

            if (!Schema::hasColumn('Pegawai', 'golongan')) {
                $table->string('golongan', 100)->nullable();
            }

            if (!Schema::hasColumn('Pegawai', 'status')) {
                $table->string('status', 20)->default('Aktif');
            }

            if (!Schema::hasColumn('Pegawai', 'tanggalMasuk')) {
                $table->date('tanggalMasuk')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('Pegawai')) {
            return;
        }

        Schema::table('Pegawai', function (Blueprint $table) {
            $dropColumns = [];

            if (Schema::hasColumn('Pegawai', 'jabatan')) {
                $dropColumns[] = 'jabatan';
            }

            if (Schema::hasColumn('Pegawai', 'departemen')) {
                $dropColumns[] = 'departemen';
            }

            if (Schema::hasColumn('Pegawai', 'golongan')) {
                $dropColumns[] = 'golongan';
            }

            if (Schema::hasColumn('Pegawai', 'status')) {
                $dropColumns[] = 'status';
            }

            if (Schema::hasColumn('Pegawai', 'tanggalMasuk')) {
                $dropColumns[] = 'tanggalMasuk';
            }

            if (!empty($dropColumns)) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};
