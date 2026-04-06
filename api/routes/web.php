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

    // Akses dokumen tanpa perlu token (file sudah berada di storage publik)
    Route::get('documents/{id}/stream', [PegawaiController::class, 'streamDocument']);
    Route::get('documents/{id}/download', [PegawaiController::class, 'downloadDocument']);

    Route::middleware('api.auth')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::get('pegawai', [PegawaiController::class, 'index']);
        Route::post('pegawai', [PegawaiController::class, 'store']);
        Route::get('pegawai/{id}', [PegawaiController::class, 'show']);
        Route::get('karir/naik-pangkat', [CareerController::class, 'promotionEligibility']);
        Route::get('karir/naik-pangkat/export', [CareerController::class, 'exportPromotionCsv']);
        Route::get('karir/satyalancana', [CareerController::class, 'satyalancana']);
        Route::get('karir/satyalancana/export', [CareerController::class, 'exportSatyalancanaCsv']);
        Route::get('karir/summary', [CareerController::class, 'summary']);
        Route::get('karir/status-proses', [CareerController::class, 'processStatuses']);
        Route::post('karir/status-proses/sync', [CareerController::class, 'syncProcessStatuses']);
        Route::patch('karir/status-proses/{id}', [CareerController::class, 'updateProcessStatus']);
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
