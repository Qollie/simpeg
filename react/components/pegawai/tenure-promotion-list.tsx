"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ArrowRight, Medal } from "lucide-react"
import type { Pegawai } from "@/lib/types"
import { golonganList } from "@/lib/mock-data"

interface TenurePromotionListProps {
  data: Pegawai[]
}

export function TenurePromotionList({ data }: TenurePromotionListProps) {

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

  const pegawaiSenior = data
    .map((p) => {
      const { tahun, bulan } = hitungMasaKerja(p.tanggalMasuk || '')
      return {
        ...p,
        masaKerjaTahun: tahun,
        masaKerjaBulan: bulan,
        golonganBerikutnya: dapatkanGolonganBerikutnya(p.golongan || '')
      }
    })
    .filter((p) => p.masaKerjaTahun >= 10 && p.masaKerjaTahun <= 20 && p.status === "Aktif" && p.golonganBerikutnya)
    .sort((a, b) => b.masaKerjaTahun - a.masaKerjaTahun)

  if (pegawaiSenior.length === 0) {
    return (
      <Card className="border-border p-8 text-center h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Tidak ada pegawai senior (10-20 tahun) yang memenuhi syarat saat ini.
        </p>
      </Card>
    )
  }

  return (
    <Card className="border-border h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Medal className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Pegawai Senior (10-20 Tahun)</CardTitle>
            <CardDescription>Daftar pegawai dengan lama pengabdian antara 10 hingga 20 tahun yang layak naik pangkat.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
              {pegawaiSenior.map((pegawai) => (
                <TableRow key={pegawai.nipPegawai} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{pegawai.nipPegawai}</span>
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
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-[10px] px-1.5">
                      Senior
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