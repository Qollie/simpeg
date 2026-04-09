<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KarirStatusProses extends Model
{
    protected $table = 'KarirStatusProses';

    protected $fillable = [
        'nipPegawai',
        'cycleNumber',
        'tmtGolonganDasar',
        'eligibleDate',
        'golonganSebelum',
        'status',
        'processedAt',
    ];

    protected $casts = [
        'status' => 'boolean',
        'tmtGolonganDasar' => 'date',
        'eligibleDate' => 'date',
        'processedAt' => 'date',
    ];
}
