<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('Kepegawaian', function (Blueprint $table) {
            $table->date('tmtPppk')->nullable()->after('tmtPns');
        });
    }

    public function down(): void
    {
        Schema::table('Kepegawaian', function (Blueprint $table) {
            $table->dropColumn('tmtPppk');
        });
    }
};
