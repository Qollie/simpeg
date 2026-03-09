<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pegawai extends Model
{
    protected $table = 'Pegawai';
    protected $primaryKey = 'nipPegawai';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'nipPegawai', 'nama', 'gelarDepan', 'gelarBelakang', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'agama', 'alamat', 'email', 'noHp', 'foto', 'jabatan', 'departemen', 'golongan', 'status', 'tanggalMasuk'
    ];

    public function identitasResmi()
    {
        return $this->hasOne(IdentitasResmi::class, 'nipIdResmi', 'nipPegawai');
    }

    public function kepegawaian()
    {
        return $this->hasOne(Kepegawaian::class, 'nipKepegawaian', 'nipPegawai');
    }

    public function efiles()
    {
        return $this->hasMany(EfilePegawai::class, 'nipEfile', 'nipPegawai');
    }

    public function riwayatPangkat()
    {
        return $this->hasMany(RiwayatPangkat::class, 'nipRiwayat', 'nipPegawai');
    }

    public function riwayatPangkatTerbaru()
    {
        return $this->hasOne(RiwayatPangkat::class, 'nipRiwayat', 'nipPegawai')->latestOfMany('tmtPangkat');
    }
}
