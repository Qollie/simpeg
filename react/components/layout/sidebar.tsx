import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Settings,
  FolderArchive,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobileMenuOpen: boolean
  onMobileClose: () => void
}

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Data Pegawai",
    href: "/pegawai",
    icon: Users,
  },
  {
    title: "Karir",
    href: "/karir",
    icon: TrendingUp,
  },
  {
    title: "Pengaturan",
    href: "/pengaturan",
    icon: Settings,
  },
]

export function Sidebar({
  isCollapsed,
  onToggle,
  isMobileMenuOpen,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        // Desktop styles
        "lg:z-40",
        isCollapsed ? "lg:w-16" : "lg:w-64",
        // Mobile styles - slide from left
        "-translate-x-full lg:translate-x-0",
        isMobileMenuOpen && "translate-x-0",
        "w-72 lg:w-64",
        isCollapsed && "lg:w-16"
      )}
    >
      {/* Logo - Kaltim Branding */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 shadow-md flex-shrink-0">
            <FolderArchive className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {(!isCollapsed || isMobileMenuOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-wide text-sidebar-foreground truncate">
                SIMPEG KALTIM
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                Arsip Kepegawaian
              </span>
            </div>
          )}
        </div>
        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground lg:hidden flex-shrink-0"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {(!isCollapsed || isMobileMenuOpen) && <span className="truncate">{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Button - Desktop only */}
      <div className="border-t border-sidebar-border p-3 lg:block">
        {/* Collapse Button */}
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Tutup Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
