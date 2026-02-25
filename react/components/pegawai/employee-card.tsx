"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, FileUp, Eye, ChevronRight } from "lucide-react"
import type { Pegawai } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EmployeeCardProps {
  data: Pegawai[]
  onEdit: (pegawai: Pegawai) => void
  onUpload: (pegawai: Pegawai) => void
  onView: (pegawai: Pegawai) => void
}

const statusVariant = {
  Aktif: "status-aktif",
  Cuti: "status-cuti",
  Pensiun: "status-pensiun",
}

export function EmployeeCard({
  data,
  onEdit,
  onUpload,
  onView,
}: EmployeeCardProps) {
  if (data.length === 0) {
    return (
      <Card className="border-border p-8 text-center transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
        <p className="text-sm text-muted-foreground">
          Tidak ada data pegawai ditemukan
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((pegawai) => (
        <Card
          key={pegawai.nipPegawai}
          className="border-border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            {/* Info */}
            <div className="flex-1 space-y-1" onClick={() => onView(pegawai)}>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {pegawai.nama}
                </h3>
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusVariant[pegawai.status as keyof typeof statusVariant] || "")}
                >
                  {pegawai.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{pegawai.jabatan}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{pegawai.nipPegawai}</span>
                <span>•</span>
                <span className="font-medium text-foreground/80">{pegawai.golongan}</span>
                <span>•</span>
                <span>{pegawai.departemen}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {pegawai.efiles?.length || 0} dokumen
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => onEdit(pegawai)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => onUpload(pegawai)}
              >
                <FileUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => onView(pegawai)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
