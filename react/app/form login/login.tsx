import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuth, isAuthenticated } from "@/lib/auth";
import { prefetchUrl } from "@/lib/api";

// URL yang langsung dipanaskan begitu login berhasil
const LOGIN_PREFETCH_URLS = [
  "/api/pegawai?page=1&per_page=10",
  "/api/pegawai?per_page=10",
  "/api/pegawai?status=Cuti&per_page=1",
  "/api/karir/naik-pangkat?page=1&per_page=10&near_years=1",
  "/api/karir/satyalancana?page=1&per_page=10&near_years=1",
  "/api/karir/summary?near_years=1",
  "/api/karir/status-proses?page=1&per_page=10",
]

type TurnstileRenderOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
};

type TurnstileInstance = {
  render: (
    elementOrId: HTMLElement | string,
    options: TurnstileRenderOptions
  ) => string;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const turnstileSiteKey = import.meta.env
    .VITE_TURNSTILE_SITE_KEY as string | undefined;
  const disableTurnstile =
    String(import.meta.env.VITE_DISABLE_TURNSTILE ?? "false").toLowerCase() === "true";

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (disableTurnstile) {
      setTurnstileReady(true);
      setTurnstileToken("dev-bypass-token");
      setTurnstileError("");
      return;
    }

    if (!turnstileSiteKey) {
      setTurnstileError(
        "Kunci Turnstile belum dikonfigurasi (VITE_TURNSTILE_SITE_KEY)."
      );
      return;
    }

    if (window.turnstile) {
      setTurnstileReady(true);
      return;
    }

    let script = document.getElementById(
      TURNSTILE_SCRIPT_ID
    ) as HTMLScriptElement | null;

    const handleLoad = () => setTurnstileReady(true);
    const handleError = () =>
      setTurnstileError(
        "Gagal memuat skrip Cloudflare Turnstile. Periksa koneksi Anda."
      );

    if (script) {
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
      return () => {
        script?.removeEventListener("load", handleLoad);
        script?.removeEventListener("error", handleError);
      };
    }

    script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.head.appendChild(script);

    return () => {
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [disableTurnstile, turnstileSiteKey]);

  useEffect(() => {
    if (disableTurnstile) {
      return;
    }

    if (
      !turnstileReady ||
      !widgetRef.current ||
      !window.turnstile ||
      !turnstileSiteKey
    ) {
      return;
    }

    if (widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
      return;
    }

    widgetIdRef.current = window.turnstile.render(widgetRef.current, {
      sitekey: turnstileSiteKey,
      theme: "dark",
      callback: (token: string) => {
        setTurnstileToken(token);
        setTurnstileError("");
      },
      "error-callback": () => {
        setTurnstileToken("");
        setTurnstileError("Verifikasi captcha gagal. Silakan coba lagi.");
      },
      "expired-callback": () => {
        setTurnstileToken("");
        setTurnstileError("Captcha kedaluwarsa. Silakan verifikasi ulang.");
      },
    });
  }, [disableTurnstile, turnstileReady, turnstileSiteKey]);

  const resetTurnstile = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    setTurnstileToken("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!disableTurnstile && !turnstileSiteKey) {
      setError(
        "Captcha belum dikonfigurasi. Set VITE_TURNSTILE_SITE_KEY di frontend."
      );
      return;
    }

    if (!disableTurnstile && !turnstileToken) {
      setError("Silakan selesaikan captcha terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const body = new URLSearchParams({
        username,
        password,
        turnstile_token: turnstileToken,
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
        let detail = "";
        try {
          const json = await response.json();
          detail = json?.message ?? "";
        } catch {
          detail = await response.text();
        }

        throw new Error(detail || `Login gagal (${response.status}).`);
      }

      const json = await response.json();
      setAuth({ token: json.token, user: json.user });
      // Mulai prefetch semua halaman utama SEBELUM navigate
      // sehingga saat dashboard/pegawai render, data sudah ada di cache
      LOGIN_PREFETCH_URLS.forEach(prefetchUrl);
      navigate("/");
    } catch (err: any) {
      const message =
        err?.message?.includes("Username atau password salah")
          ? "Username atau password salah."
          : err?.message ||
            "Login gagal. Pastikan server API aktif dan kredensial benar.";

      setError(message);
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" aria-hidden />
        <div
          className="absolute inset-0 opacity-75"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.28), transparent 32%), radial-gradient(circle at 80% 15%, rgba(59, 130, 246, 0.24), transparent 28%), radial-gradient(circle at 55% 80%, rgba(14, 165, 233, 0.22), transparent 30%)",
          }}
        />
        <img
          src="/bg-login.jpeg"
          alt="Kantor Disdukcapil Samarinda"
          loading="lazy"
          className="w-full h-full object-cover opacity-92 mix-blend-screen"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/10 via-black/15 to-black/30"
          aria-hidden
        />
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
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-white">
                  Verifikasi Cloudflare
                </label>
                {disableTurnstile ? (
                  <div className="rounded-md border border-amber-400/50 bg-amber-500/20 p-2 text-xs text-amber-100">
                    Mode development aktif. Verifikasi captcha dilewati sementara.
                  </div>
                ) : (
                  <div>
                    <div
                      ref={widgetRef}
                      className="cf-turnstile min-h-[65px]"
                      data-sitekey={turnstileSiteKey}
                    >
                      {!turnstileReady && !turnstileError
                        ? "Memuat captcha..."
                        : null}
                    </div>
                  </div>
                )}
                {turnstileError && (
                  <p className="mt-2 text-[11px] text-red-200">{turnstileError}</p>
                )}
                {!disableTurnstile && !turnstileSiteKey && (
                  <p className="mt-2 text-[11px] text-amber-200">
                    Tambahkan VITE_TURNSTILE_SITE_KEY di file .env frontend.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  loading || (!disableTurnstile && (!turnstileToken || !!turnstileError || !turnstileSiteKey))
                }
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
