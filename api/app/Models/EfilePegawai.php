<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EfilePegawai extends Model
{
    protected $table = 'EfilePegawai';
    protected $primaryKey = 'idFile';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = ['nipEfile', 'jenisDokumen', 'namaFile', 'filePath', 'waktuUpload'];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'nipEfile', 'nipPegawai');
    }
}
