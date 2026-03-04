"use client"

import { Menu, LogOut, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { clearAuth } from "@/lib/auth"

interface TopbarProps {
  title: string
  onMobileMenuToggle: () => void
}

export function Topbar({ title, onMobileMenuToggle }: TopbarProps) {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [adminProfile, setAdminProfile] = useState({
    nama: 'Admin',
    email: '',
    foto: '',
  })

  useEffect(() => {
    // Check if dark mode is enabled
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)

    const loadProfile = () => {
      fetch('/api/admin/profile')
        .then((r) => r.json())
        .then((json) => {
          setAdminProfile({
            nama: json.nama ?? 'Admin',
            email: json.email ?? '',
            foto: json.foto ?? '',
          })
        })
        .catch(() => {
          // keep defaults
        })
    }

    loadProfile()
    window.addEventListener('admin-profile-updated', loadProfile)

    return () => {
      window.removeEventListener('admin-profile-updated', loadProfile)
    }
  }, [])

  const toggleDarkMode = () => {
    const html = document.documentElement
    if (html.classList.contains('dark')) {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:h-16 md:px-6">
      {/* Left Section */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 flex-shrink-0"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title */}
        <h1 className="text-base md:text-lg font-semibold text-foreground truncate">
          {title}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Search removed as requested */}

        {/* Dark/Light Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleDarkMode}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>

        {/* Profile Avatar (moved from sidebar) - opens profile preview */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setShowProfileDialog(true)}
          title="Profil"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={adminProfile.foto || undefined} />
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {(adminProfile.nama || 'AD').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-destructive hover:bg-destructive/10"
          title="Logout"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Konfirmasi Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Apakah Anda yakin ingin keluar dari aplikasi? Anda akan diarahkan ke halaman login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center gap-3">
            <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Dialog - show larger avatar on click */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="w-full max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Profil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 px-6 pb-4">
            <Avatar className="h-28 w-28">
              <AvatarImage src={adminProfile.foto || undefined} />
              <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
                {(adminProfile.nama || 'AD').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-base font-semibold text-foreground">{adminProfile.nama || 'Admin'}</p>
            <p className="text-sm text-muted-foreground">{adminProfile.email || 'admin@instansi.go.id'}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowProfileDialog(false)} className="mx-auto">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}