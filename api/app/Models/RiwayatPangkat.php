<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiwayatPangkat extends Model
{
    protected $table = 'RiwayatPangkat';
    protected $primaryKey = 'idRiwayat';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = ['nipRiwayat', 'idPangkatRiwayat', 'tmtPangkat', 'tmtSelesai', 'status'];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'nipRiwayat', 'nipPegawai');
    }

    public function pangkat()
    {
        return $this->belongsTo(Pangkat::class, 'idPangkatRiwayat', 'idPangkat');
    }
}
