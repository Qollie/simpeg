"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, FileUp, Eye, Trash2, Clock } from "lucide-react"
import type { Pegawai } from "@/lib/types"
import { cn, calculateWorkDuration } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface EmployeeListProps {
  data: Pegawai[]
  loading?: boolean
  onEdit: (pegawai: Pegawai) => void
  onUpload: (pegawai: Pegawai) => void
  onView: (pegawai: Pegawai) => void
  onDelete: (pegawaiId: string, pegawaiNama: string) => void
}

const statusVariant = {
  Aktif: "status-aktif",
  Cuti: "status-cuti",
  Pensiun: "status-pensiun",
}

function SkeletonRow() {
  return (
    <TableRow className="border-border">
      <TableCell className="py-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-3 w-36" />
        </div>
      </TableCell>
      <TableCell className="py-4"><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell className="py-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
      </TableCell>
      <TableCell className="py-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  )
}

function SkeletonCard() {
  return (
    <Card className="border-border p-4">
      <div className="flex flex-col gap-3">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-52" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex items-center justify-end gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </Card>
  )
}

export function EmployeeList({
  data,
  loading = false,
  onEdit,
  onUpload,
  onView,
  onDelete,
}: EmployeeListProps) {
  // Pertama kali load (belum ada data) → tampilkan skeleton penuh
  if (loading && data.length === 0) {
    return (
      <>
        {/* Desktop Skeleton */}
        <div className="hidden rounded-xl border border-border bg-card md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-[400px]">Data Pegawai</TableHead>
                <TableHead className="text-muted-foreground">Golongan</TableHead>
                <TableHead className="text-muted-foreground">Status & Lama Kerja</TableHead>
                <TableHead className="text-center text-muted-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </TableBody>
          </Table>
        </div>
        {/* Mobile Skeleton */}
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="border-border p-8 text-center transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
        <p className="text-sm text-muted-foreground">
          Tidak ada data pegawai ditemukan
        </p>
      </Card>
    )
  }

  // Ada data sebelumnya + loading → tampilkan data lama redup (keep previous data)
  const dimmed = loading && data.length > 0

  return (
    <div className={cn("transition-opacity duration-200", dimmed && "pointer-events-none opacity-50")}>
      {/* Desktop Table */}
      <div className="hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground w-[400px]">Data Pegawai</TableHead>
              <TableHead className="text-muted-foreground">Golongan</TableHead>
              <TableHead className="text-muted-foreground">Status & Lama Kerja</TableHead>
              <TableHead className="text-center text-muted-foreground"> Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((pegawai) => (
              <TableRow
                key={pegawai.nipPegawai}
                className="border-border transition-colors hover:bg-secondary/50"
              >
                <TableCell className="align-top py-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <div className="font-semibold text-foreground text-base">
                        {pegawai.nama}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pegawai.email}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="secondary" className="font-mono font-normal text-xs rounded-sm px-1.5 h-5">
                        {pegawai.nipPegawai}
                      </Badge>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-medium text-foreground/80">
                        {pegawai.jabatan}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pegawai.departemen}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-top py-4 text-foreground">
                  {pegawai.golongan}
                </TableCell>
                <TableCell className="align-top py-4">
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant="outline"
                      className={cn("font-medium w-fit", statusVariant[pegawai.status as keyof typeof statusVariant] || "")}
                    >
                      {pegawai.status}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{pegawai.tanggalMasuk ? calculateWorkDuration(pegawai.tanggalMasuk) : '-'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-top py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => onView(pegawai)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => onEdit(pegawai)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-accent"
                      onClick={() => onUpload(pegawai)}
                    >
                      <FileUp className="h-4 w-4" />
                    </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(pegawai.nipPegawai, pegawai.nama)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {data.map((pegawai) => (
          <Card key={pegawai.nipPegawai} className="border-border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="flex-1 space-y-1 text-left"
                onClick={() => onView(pegawai)}
              >
                <div className="flex items-start gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground leading-tight flex-1">
                    {pegawai.nama}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn("text-sm whitespace-nowrap", statusVariant[pegawai.status as keyof typeof statusVariant] || "")}
                  >
                    {pegawai.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{pegawai.jabatan}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-sm text-muted-foreground">
                  <span className="font-mono">{pegawai.nipPegawai}</span>
                  <span className="hidden sm:inline">-</span>
                  <span className="font-medium text-foreground/80">{pegawai.golongan}</span>
                  <span className="hidden sm:inline">-</span>
                  <span className="line-clamp-1">{pegawai.departemen}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Bekerja selama {pegawai.tanggalMasuk ? calculateWorkDuration(pegawai.tanggalMasuk) : '-'}
                    </span>
                </div>
              </button>

              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => onView(pegawai)}
                  title="Lihat detail"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => onEdit(pegawai)}
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-accent"
                  onClick={() => onUpload(pegawai)}
                  title="Upload dokumen"
                >
                  <FileUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(pegawai.nipPegawai, pegawai.nama)}
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
