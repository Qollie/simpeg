<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('KarirStatusProses', function (Blueprint $table) {
            $table->dropUnique(['nipPegawai']);
            $table->unsignedInteger('cycleNumber')->default(1)->after('nipPegawai');
            $table->date('tmtGolonganDasar')->nullable()->after('cycleNumber');
            $table->date('eligibleDate')->nullable()->after('tmtGolonganDasar');
            $table->date('processedAt')->nullable()->after('status');
        });

        DB::table('KarirStatusProses')->update([
            'cycleNumber' => 1,
        ]);

        Schema::table('KarirStatusProses', function (Blueprint $table) {
            $table->unique(['nipPegawai', 'cycleNumber']);
        });
    }

    public function down(): void
    {
        Schema::table('KarirStatusProses', function (Blueprint $table) {
            $table->dropUnique(['nipPegawai', 'cycleNumber']);
            $table->dropColumn(['cycleNumber', 'tmtGolonganDasar', 'eligibleDate', 'processedAt']);
            $table->unique('nipPegawai');
        });
    }
};
