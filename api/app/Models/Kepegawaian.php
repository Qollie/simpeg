<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kepegawaian extends Model
{
    protected $table = 'Kepegawaian';
    protected $primaryKey = 'nipKepegawaian';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['nipKepegawaian', 'statusPegawai', 'jenisPegawai', 'tmtCpns', 'tmtPns', 'tmtPppk', 'masaKerjaTahun', 'masaKerjaBulan'];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'nipKepegawaian', 'nipPegawai');
    }
}
