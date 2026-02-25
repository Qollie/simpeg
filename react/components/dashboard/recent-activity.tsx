import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, UserPlus, Edit3, Upload } from "lucide-react"
import type { UpdateTerbaru } from "@/lib/types"

interface PropsAktivitasTerbaru {
  daftarAktivitas: UpdateTerbaru[]
}

const dapatkanIkonAktivitas = (aksi: string) => {
  if (aksi.includes("Dokumen")) return Upload
  if (aksi.includes("Pegawai Baru")) return UserPlus
  if (aksi.includes("Diperbarui")) return Edit3
  return FileText
}

const dapatkanWarnaAktivitas = (aksi: string) => {
  if (aksi.includes("Dokumen")) return "bg-accent/10 text-accent"
  if (aksi.includes("Pegawai Baru")) return "bg-primary/10 text-primary"
  if (aksi.includes("Diperbarui")) return "bg-chart-3/20 text-chart-3"
  return "bg-muted text-muted-foreground"
}

export function AktivitasTerbaru({ daftarAktivitas }: PropsAktivitasTerbaru) {
  return (
    <Card className="h-full min-h-[450px] flex flex-col border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
      <CardHeader className="pb-3 px-4 pt-4 md:px-6 md:pt-6">
        <CardTitle className="text-base md:text-lg font-semibold">Update Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 px-4 pb-4 md:space-y-4 md:px-6 md:pb-6">
        {daftarAktivitas.map((aktivitas) => {
          const Ikon = dapatkanIkonAktivitas(aktivitas.aksi)
          const kelasWarna = dapatkanWarnaAktivitas(aktivitas.aksi)

          return (
            <div
              key={aktivitas.id}
              className="flex items-start gap-3 md:gap-4 rounded-lg border border-border/50 bg-secondary/30 p-3 md:p-4 transition-all duration-300 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md"
            >
              <div className={`rounded-lg p-2 flex-shrink-0 ${kelasWarna}`}>
                <Ikon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {aktivitas.aksi}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                  {aktivitas.detail}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{aktivitas.waktu}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{aktivitas.user}</span>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
