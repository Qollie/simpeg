<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Illuminate\Http\Request;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 15);
        $page = (int) $request->query('page', 1);
        $q = $request->query('q');
        $departemen = $request->query('departemen');
        $status = $request->query('status');

        $query = Pegawai::with(['identitasResmi', 'kepegawaian', 'riwayatPangkat', 'efiles']);

        if ($q) {
            $query->where(function($sub) use ($q) {
                $sub->where('nama', 'ilike', "%{$q}%")
                    ->orWhere('nipPegawai', 'ilike', "%{$q}%")
                    ->orWhere('email', 'ilike', "%{$q}%");
            });
        }

        if ($departemen) {
            $query->where('departemen', 'ilike', "%{$departemen}%");
        }

        if ($status) {
            $query->where('status', 'ilike', "%{$status}%");
        }

        return $query->orderBy('nama')->paginate($perPage, ['*'], 'page', $page);
    }

    public function show($id)
    {
        return Pegawai::with(['identitasResmi', 'kepegawaian', 'riwayatPangkat', 'efiles'])->findOrFail($id);
    }
}
