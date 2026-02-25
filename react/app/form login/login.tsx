import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect ke dashboard utama
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
          alt="Kantor Disdukcapil" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full mx-auto max-w-md">
          <div className="rounded-lg border border-white/20 bg-black/40 backdrop-blur-2xl p-4 sm:p-8 shadow-2xl transition-all duration-300 hover:scale-[1.01]">
            <h1 className="mb-2 text-xl sm:text-2xl font-bold text-center text-white">Masuk ke Sistem</h1>
            <p className="mb-4 sm:mb-6 text-center text-xs sm:text-sm text-white/80">
              Masukkan kredensial Anda untuk melanjutkan
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="username" className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-white">
                  Username
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
                <label htmlFor="password" className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium text-white">
                  Password
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

              <button
                type="submit"
                className="w-full rounded-md bg-primary py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-opacity"
              >
                Login
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