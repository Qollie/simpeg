<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function challenge()
    {
        // 70% mudah (penjumlahan), 30% sedang (perkalian)
        $isEasy = random_int(1, 100) <= 70;

        if ($isEasy) {
            $a = random_int(1, 20);
            $b = random_int(1, 20);
            $operator = '+';
            $answer = $a + $b;
            $level = 'mudah';
        } else {
            $a = random_int(2, 12);
            $b = random_int(2, 12);
            $operator = 'x';
            $answer = $a * $b;
            $level = 'sedang';
        }

        $challengeId = (string) Str::uuid();

        Cache::put($this->challengeKey($challengeId), $answer, now()->addMinutes(5));

        return response()->json([
            'challenge_id' => $challengeId,
            'level' => $level,
            'question' => "Berapa {$a} {$operator} {$b}?",
            'expires_in' => 300,
        ]);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'challenge_id' => ['required', 'string'],
            'challenge_answer' => ['required', 'integer'],
        ]);

        if (!$this->validateChallenge($validated['challenge_id'], (int) $validated['challenge_answer'])) {
            return response()->json([
                'message' => 'Jawaban captcha salah atau sudah kedaluwarsa.',
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

    private function challengeKey(string $challengeId): string
    {
        return 'auth_challenge:'.$challengeId;
    }

    private function validateChallenge(string $challengeId, int $answer): bool
    {
        $key = $this->challengeKey($challengeId);
        $expected = Cache::get($key);

        // One-time challenge: always invalidate once checked.
        Cache::forget($key);

        if (!is_numeric($expected)) {
            return false;
        }

        return (int) $expected === $answer;
    }
}
