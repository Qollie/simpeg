"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ArrowRight } from "lucide-react"
import type { Pegawai } from "@/lib/types"
import { golonganList } from "@/lib/mock-data"

interface PromotionListProps {
  data: Pegawai[]
}

export function PromotionList({ data }: PromotionListProps) {

  const hitungMasaKerja = (tanggalMasuk: string) => {
    const mulai = new Date(tanggalMasuk)
    const sekarang = new Date()
    
    let tahun = sekarang.getFullYear() - mulai.getFullYear()
    let bulan = sekarang.getMonth() - mulai.getMonth()
    
    if (bulan < 0 || (bulan === 0 && sekarang.getDate() < mulai.getDate())) {
      tahun--
      bulan += 12
    }
    
    return { tahun, bulan }
  }

  const dapatkanGolonganBerikutnya = (golongan: string) => {
    const index = golonganList.indexOf(golongan)
    if (index !== -1 && index < golonganList.length - 1) {
      return golonganList[index + 1]
    }
    return null
  }

  const pegawaiLayak = data
    .map((p) => {
      const { tahun, bulan } = hitungMasaKerja(p.tanggalMasuk || '')
      return {
        ...p,
        masaKerjaTahun: tahun,
        masaKerjaBulan: bulan,
        golonganBerikutnya: dapatkanGolonganBerikutnya(p.golongan || '')
      }
    })
    .filter((p) => p.masaKerjaTahun >= 2 && p.masaKerjaTahun <= 4 && p.status === "Aktif" && p.golonganBerikutnya)
    .sort((a, b) => b.masaKerjaTahun - a.masaKerjaTahun)

  return (
    <Card className="border-border h-full">
      <CardContent className="p-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent bg-secondary/30">
                <TableHead className="text-muted-foreground">Pegawai</TableHead>
                <TableHead className="text-muted-foreground">Lama Kerja</TableHead>
                <TableHead className="text-muted-foreground">Golongan</TableHead>
                <TableHead className="text-muted-foreground">Target</TableHead>
                <TableHead className="text-center text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pegawaiLayak.map((pegawai) => (
                <TableRow key={pegawai.nipPegawai} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono">{pegawai.nipPegawai}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{pegawai.masaKerjaTahun} Thn</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground text-xs">{pegawai.golongan?.split('(')[1]?.replace(')', '') || pegawai.golongan}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-primary font-medium text-xs">
                      <ArrowRight className="h-3 w-3" />
                      {pegawai.golonganBerikutnya?.split('(')[1]?.replace(')', '')}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 text-[10px] px-1.5">
                      Layak
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}