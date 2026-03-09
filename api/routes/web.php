<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CareerController;
use App\Http\Controllers\Api\PegawaiController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->withoutMiddleware([ValidateCsrfToken::class])->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::middleware('api.auth')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::get('pegawai', [PegawaiController::class, 'index']);
        Route::post('pegawai', [PegawaiController::class, 'store']);
        Route::get('pegawai/{id}', [PegawaiController::class, 'show']);
        Route::get('karir/naik-pangkat', [CareerController::class, 'promotionEligibility']);
        Route::get('karir/satyalancana', [CareerController::class, 'satyalancana']);
        Route::post('pegawai/{id}', [PegawaiController::class, 'update']);
        Route::put('pegawai/{id}', [PegawaiController::class, 'update']);
        Route::delete('pegawai/{id}', [PegawaiController::class, 'destroy']);
        Route::post('pegawai/{id}/documents', [PegawaiController::class, 'uploadDocument']);
        Route::patch('documents/{id}', [PegawaiController::class, 'renameDocument']);
        Route::delete('documents/{id}', [PegawaiController::class, 'deleteDocument']);

        Route::get('admin/profile', [AdminController::class, 'profile']);
        Route::post('admin/profile', [AdminController::class, 'updateProfile']);
        Route::post('admin/password', [AdminController::class, 'updatePassword']);
    });
});
