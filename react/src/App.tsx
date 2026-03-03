import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import DashboardPage from "@/app/page";
import PegawaiPage from "@/app/pegawai/page";
import PengaturanPage from "@/app/pengaturan/page";
import LoginPage from "@/app/form login/login"; // Import halaman Login
import KarirPage from "@/components/pegawai/page";
import { Toaster } from "@/components/ui/toaster";
import PegawaiList from "@/components/pegawai/PegawaiList";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { isAuthenticated } from "@/lib/auth";

// Pastikan setiap kunjungan awal diarahkan ke login jika belum autentik
function LoginGate() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated() && location.pathname !== "/login") {
      navigate("/login", { replace: true, state: { from: location } });
    }
  }, [location, navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <LoginGate />
      <Routes>
        {/* Halaman Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Halaman Dashboard */}
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        
        {/* Halaman Pegawai */}
        <Route path="/pegawai" element={<ProtectedRoute><PegawaiPage /></ProtectedRoute>} />

        {/* Halaman Pegawai (API demo) */}
        <Route path="/pegawai-api" element={<ProtectedRoute><PegawaiList /></ProtectedRoute>} />

        {/* Halaman Karir */}
        <Route path="/karir" element={<ProtectedRoute><KarirPage /></ProtectedRoute>} />

        {/* Halaman Pengaturan */}
        <Route path="/pengaturan" element={<ProtectedRoute><PengaturanPage /></ProtectedRoute>} />

        {/* Fallback: arahkan ke halaman utama (akan redirect ke login bila belum autentik) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
