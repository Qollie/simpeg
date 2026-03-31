<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KarirStatusProses extends Model
{
    protected $table = 'KarirStatusProses';

    protected $fillable = [
        'nipPegawai',
        'status',
    ];
}
