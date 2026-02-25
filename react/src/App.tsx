import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "@/app/page";
import PegawaiPage from "@/app/pegawai/page";
import PengaturanPage from "@/app/pengaturan/page";
import LoginPage from "@/app/form login/login"; // Import halaman Login
import KarirPage from "@/components/pegawai/page";
import { Toaster } from "@/components/ui/toaster";
import PegawaiList from "@/components/pegawai/PegawaiList";

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Halaman Dashboard */}
        <Route path="/" element={<DashboardPage />} />
        
        {/* Halaman Pegawai */}
        <Route path="/pegawai" element={<PegawaiPage />} />

        {/* Halaman Pegawai (API demo) */}
        <Route path="/pegawai-api" element={<PegawaiList />} />

        {/* Halaman Karir */}
        <Route path="/karir" element={<KarirPage />} />

        {/* Halaman Pengaturan */}
        <Route path="/pengaturan" element={<PengaturanPage />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;