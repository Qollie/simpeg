import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Settings, TrendingUp } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Pegawai",
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

export function BottomNav() {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-lg">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn("text-xs font-medium", isActive && "text-primary")}>
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  )
}
