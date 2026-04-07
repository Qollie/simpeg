"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import { prefetchUrl } from "@/lib/api"

// URL yang dipanaskan segera setelah AdminLayout pertama kali mount (background)
const WARMUP_URLS = [
  "/api/pegawai?page=1&per_page=10",
  "/api/pegawai?per_page=10",
  "/api/pegawai?status=Cuti&per_page=1",
  "/api/karir/naik-pangkat?page=1&per_page=10&near_years=1",
  "/api/karir/satyalancana?page=1&per_page=10&near_years=1",
  "/api/karir/summary?near_years=1",
  "/api/karir/status-proses?page=1&per_page=10",
]

interface AdminLayoutProps {
  children: ReactNode
  title: string
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Fallback warmup — jika user membuka halaman langsung tanpa melalui login
  // (misal: buka tab baru dengan URL /pegawai secara langsung)
  useEffect(() => {
    WARMUP_URLS.forEach(prefetchUrl)
  }, []) // hanya saat pertama mount

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          "lg:ml-64",
          isCollapsed && "lg:ml-16"
        )}
      >
        <Topbar
          title={title}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 overflow-auto">
          <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-border bg-card px-3 py-3 sm:px-4 md:px-6 md:py-4">
          <div className="flex flex-col items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground md:flex-row md:gap-4">
            <p className="text-center md:text-left">SIMPEG Kaltim - Sistem Informasi Manajemen Pegawai</p>
            <p className="text-center md:text-right">Pemerintah Provinsi Kalimantan Timur</p>
          </div>
        </footer>
      </div>
      
      <Toaster />
    </div>
  )
}
