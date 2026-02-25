<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pangkat extends Model
{
    protected $table = 'Pangkat';
    protected $primaryKey = 'idPangkat';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = ['pangkat', 'golongan', 'ruang', 'urutan'];

    public function riwayat()
    {
        return $this->hasMany(RiwayatPangkat::class, 'idPangkatRiwayat', 'idPangkat');
    }
}
