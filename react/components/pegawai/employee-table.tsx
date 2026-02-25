"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, FileUp, Eye } from "lucide-react"
import type { Pegawai } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EmployeeTableProps {
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

export function EmployeeTable({
  data,
  onEdit,
  onUpload,
  onView,
}: EmployeeTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">NIP</TableHead>
            <TableHead className="text-muted-foreground">Nama</TableHead>
            <TableHead className="text-muted-foreground">Jabatan</TableHead>
            <TableHead className="text-muted-foreground">Departemen</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-center text-muted-foreground">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-32 text-center text-muted-foreground"
              >
                Tidak ada data pegawai ditemukan
              </TableCell>
            </TableRow>
          ) : (
            data.map((pegawai) => (
              <TableRow
                key={pegawai.nipPegawai}
                className="border-border transition-colors hover:bg-secondary/50"
              >
                <TableCell className="font-mono text-sm text-foreground">
                  {pegawai.nipPegawai}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {pegawai.nama}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {pegawai.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">
                  {pegawai.jabatan}
                </TableCell>
                <TableCell className="text-foreground">
                  {pegawai.departemen}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      statusVariant[pegawai.status as keyof typeof statusVariant] || ''
                    )}
                  >
                    {pegawai.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
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
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
