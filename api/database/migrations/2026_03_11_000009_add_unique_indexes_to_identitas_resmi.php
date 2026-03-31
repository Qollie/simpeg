<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('IdentitasResmi')) {
            return;
        }

        $uniqueColumns = [
            'nik' => 'identitas_resmi_nik_unique',
            'noBpjs' => 'identitas_resmi_no_bpjs_unique',
            'noNpwp' => 'identitas_resmi_no_npwp_unique',
            'karpeg' => 'identitas_resmi_karpeg_unique',
            'karsuKarsi' => 'identitas_resmi_karsu_karsi_unique',
            'taspen' => 'identitas_resmi_taspen_unique',
        ];

        foreach ($uniqueColumns as $column => $indexName) {
            if (!Schema::hasColumn('IdentitasResmi', $column)) {
                continue;
            }

            $hasDuplicates = DB::table('IdentitasResmi')
                ->select($column)
                ->whereNotNull($column)
                ->groupBy($column)
                ->havingRaw('COUNT(*) > 1')
                ->exists();

            if ($hasDuplicates) {
                continue;
            }

            DB::statement(sprintf(
                'CREATE UNIQUE INDEX IF NOT EXISTS "%s" ON "IdentitasResmi" ("%s")',
                $indexName,
                $column
            ));
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('IdentitasResmi')) {
            return;
        }

        $indexNames = [
            'identitas_resmi_nik_unique',
            'identitas_resmi_no_bpjs_unique',
            'identitas_resmi_no_npwp_unique',
            'identitas_resmi_karpeg_unique',
            'identitas_resmi_karsu_karsi_unique',
            'identitas_resmi_taspen_unique',
        ];

        foreach ($indexNames as $indexName) {
            DB::statement(sprintf('DROP INDEX IF EXISTS "%s"', $indexName));
        }
    }
};
