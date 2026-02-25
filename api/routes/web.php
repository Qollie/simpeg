<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PegawaiController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->group(function () {
    Route::get('pegawai', [PegawaiController::class, 'index']);
    Route::get('pegawai/{id}', [PegawaiController::class, 'show']);
});
