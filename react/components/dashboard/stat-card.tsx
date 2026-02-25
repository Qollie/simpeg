import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface PropsKartuStatistik {
  judul: string
  nilai: string | number
  ikon: LucideIcon
  tren?: {
    nilai: string
    apakahPositif: boolean
  }
  namaKelas?: string
}

export function KartuStatistik({
  judul,
  nilai,
  ikon: Ikon,
  tren,
  namaKelas,
}: PropsKartuStatistik) {
  return (
    <Card className={cn("border-border transition-all duration-300 hover:scale-105 hover:shadow-lg", namaKelas)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 md:space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{judul}</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{nilai}</p>
            {tren && (
              <p
                className={cn(
                  "text-sm font-medium",
                  tren.apakahPositif ? "text-accent" : "text-destructive"
                )}
              >
              </p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2 md:p-3 flex-shrink-0">
            <Ikon className="h-6 w-6 md:h-6 md:w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
