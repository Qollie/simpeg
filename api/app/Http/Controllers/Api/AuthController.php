<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'turnstile_token' => ['required', 'string'],
        ]);

        if (!$this->verifyTurnstile($validated['turnstile_token'], $request->ip())) {
            return response()->json([
                'message' => 'Verifikasi captcha gagal. Silakan coba lagi.',
            ], 422);
        }

        $user = User::query()
            ->where('email', $validated['username'])
            ->orWhere('name', $validated['username'])
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Username atau password salah.',
            ], 401);
        }

        $token = Str::random(64);
        $user->remember_token = $token;
        $user->save();

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'foto' => $user->foto,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->remember_token = null;
            $user->save();
        }

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    private function verifyTurnstile(string $token, ?string $ip): bool
    {
        $secret = config('services.turnstile.secret');

        if (!$secret) {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(8)
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ]);
        } catch (\Throwable $e) {
            return false;
        }

        if (!$response->ok()) {
            return false;
        }

        $data = $response->json();

        return (bool) ($data['success'] ?? false);
    }
}
