<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('IdentitasResmi', function (Blueprint $table) {
            $table->unique('nik', 'identitas_resmi_nik_unique');
            $table->unique('noBpjs', 'identitas_resmi_no_bpjs_unique');
            $table->unique('noNpwp', 'identitas_resmi_no_npwp_unique');
            $table->unique('karpeg', 'identitas_resmi_karpeg_unique');
            $table->unique('karsuKarsi', 'identitas_resmi_karsu_karsi_unique');
            $table->unique('taspen', 'identitas_resmi_taspen_unique');
        });
    }

    public function down(): void
    {
        Schema::table('IdentitasResmi', function (Blueprint $table) {
            $table->dropUnique('identitas_resmi_nik_unique');
            $table->dropUnique('identitas_resmi_no_bpjs_unique');
            $table->dropUnique('identitas_resmi_no_npwp_unique');
            $table->dropUnique('identitas_resmi_karpeg_unique');
            $table->dropUnique('identitas_resmi_karsu_karsi_unique');
            $table->dropUnique('identitas_resmi_taspen_unique');
        });
    }
};
