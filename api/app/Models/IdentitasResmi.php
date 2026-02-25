<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdentitasResmi extends Model
{
    protected $table = 'IdentitasResmi';
    protected $primaryKey = 'nipIdResmi';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['nipIdResmi', 'nik', 'noBpjs', 'noNpwp', 'karpeg', 'karsuKarsi', 'taspen'];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'nipIdResmi', 'nipPegawai');
    }
}
