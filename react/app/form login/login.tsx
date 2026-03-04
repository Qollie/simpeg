import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuth, isAuthenticated } from "@/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [challengeQuestion, setChallengeQuestion] = useState("");
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingChallenge, setLoadingChallenge] = useState(false);

  const loadChallenge = async () => {
    setLoadingChallenge(true);
    try {
      const response = await fetch("/api/auth/challenge", {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Gagal memuat captcha");
      }

      const json = await response.json();
      setChallengeId(json.challenge_id || "");
      setChallengeQuestion(json.question || "");
      setChallengeAnswer("");
    } catch {
      setChallengeId("");
      setChallengeQuestion("");
      setError("Gagal memuat captcha. Muat ulang halaman.");
    } finally {
      setLoadingChallenge(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/");
    }
    loadChallenge();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = new URLSearchParams({
        username,
        password,
        challenge_id: challengeId,
        challenge_answer: challengeAnswer,
      });

      // Use relative path so Vite dev proxy handles CORS correctly
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          `Login gagal (${response.status}) ${detail || ""}`.trim()
        );
      }

      const json = await response.json();
      setAuth({ token: json.token, user: json.user });
      navigate("/");
    } catch (err: any) {
      setError(
        err?.message?.includes("Username atau password salah")
          ? "Username atau password salah."
          : "Login gagal. Pastikan server API aktif dan kredensial benar."
      );
      await loadChallenge();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/bg-login.jpeg"
          alt="Kantor Disdukcapil"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full mx-auto max-w-md">
          <div className="rounded-lg border border-white/20 bg-black/40 backdrop-blur-2xl p-4 sm:p-8 shadow-2xl transition-all duration-300 hover:scale-[1.01]">
            <h1 className="mb-2 text-xl sm:text-2xl font-bold text-center text-white">
              Masuk ke Sistem
            </h1>
            <p className="mb-4 sm:mb-6 text-center text-xs sm:text-sm text-white/80">
              Masukkan kredensial Anda untuk melanjutkan
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="rounded-md border border-red-400/50 bg-red-500/20 p-2 text-xs text-red-100">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="username"
                  className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-white"
                >
                  Username / Email
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full rounded-md border border-white/20 bg-black/60 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-white"
                >
                  Password (Minimal 6 karakter)
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full rounded-md border border-white/20 bg-black/60 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="captcha"
                  className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-white"
                >
                  Verifikasi Human
                </label>
                <div className="mb-2 rounded-md border border-white/20 bg-black/60 px-3 py-2 text-sm text-white">
                  {loadingChallenge
                    ? "Memuat captcha..."
                    : challengeQuestion || "Captcha tidak tersedia"}
                </div>
                <input
                  type="number"
                  id="captcha"
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  placeholder="Masukkan hasil perkalian"
                  className="w-full rounded-md border border-white/20 bg-black/60 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  disabled={loadingChallenge || !challengeId}
                />
              </div>

              <button
                type="submit"
                disabled={loading || loadingChallenge || !challengeId}
                className="w-full rounded-md bg-primary py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-opacity"
              >
                {loading ? "Memproses..." : "Login"}
              </button>
            </form>

            <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-white/60">
              <p>© 2026 Sistem Arsip Digital. All rights reserved.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
