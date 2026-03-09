"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Briefcase, Medal, Eye, TrendingUp, Loader2 } from "lucide-react"

type KonteksKarir = "promosi" | "satyalancana"

export interface PaginationMeta {
  currentPage: number
  lastPage: number
  total: number
}

export interface PromotionEligibilityItem {
  nipPegawai: string
  nama: string
  foto?: string
  jabatan?: string
  golongan?: string
  masaKerjaGolonganTahun: number
  masaKerjaGolonganBulan: number
  eligibleDate?: string
}

export interface SatyalancanaItem {
  nipPegawai: string
  nama: string
  foto?: string
  jabatan?: string
  golongan?: string
  masaKerjaTahun: number
  masaKerjaBulan: number
  statusSatya: "memenuhi" | "mendekati"
  kategoriSatya: string
}

interface PropsKelayakanKenaikanPangkat {
  items: PromotionEligibilityItem[]
  pagination: PaginationMeta
  loading: boolean
  onPageChange: (page: number) => void
  lihatDetail: (nip: string, konteks: KonteksKarir) => void
}

interface PropsSatyalancanaKaryaSatya {
  items: SatyalancanaItem[]
  pagination: PaginationMeta
  loading: boolean
  onPageChange: (page: number) => void
  lihatDetail: (nip: string, konteks: KonteksKarir) => void
}

const formatTanggal = (tanggal?: string): string => {
  if (!tanggal) return "-"

  const date = new Date(tanggal)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function RenderPagination({ pagination, onPageChange }: { pagination: PaginationMeta; onPageChange: (page: number) => void }) {
  const canPrev = pagination.currentPage > 1
  const canNext = pagination.currentPage < pagination.lastPage

  return (
    <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 md:px-6">
      <p className="text-xs text-muted-foreground">
        Halaman {pagination.currentPage} dari {Math.max(1, pagination.lastPage)}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(pagination.currentPage - 1)}
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(pagination.currentPage + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  )
}

function getInitials(nama: string): string {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((bagian) => bagian[0]?.toUpperCase() ?? "")
    .join("") || "PG"
}

export function KelayakanKenaikanPangkat({ items, pagination, loading, onPageChange, lihatDetail }: PropsKelayakanKenaikanPangkat) {
  return (
    <Card className="h-full min-h-[600px] flex flex-col border-border">
      <CardHeader className="pb-3 px-4 pt-4 md:px-6 md:pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Layak Naik Pangkat
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Masa kerja golongan minimal 4 tahun dan syarat pendidikan terpenuhi
            </CardDescription>
          </div>
          <Badge variant="secondary" className="h-fit">
            {pagination.total} Pegawai
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-3 px-4 pb-4 pt-2 md:px-6 md:pb-6">
            {loading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat data...
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada pegawai yang memenuhi syarat saat ini.
              </p>
            ) : (
              items.map((pegawai) => (
                <div
                  key={pegawai.nipPegawai}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 border-green-500/30 bg-green-500/5"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={pegawai.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(pegawai.nama)}&background=random`} />
                      <AvatarFallback>{getInitials(pegawai.nama)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{pegawai.nama}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {pegawai.golongan?.split("(")[0] ?? "-"}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        Layak sejak {formatTanggal(pegawai.eligibleDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">NIP: {pegawai.nipPegawai}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
                      {pegawai.masaKerjaGolonganTahun} Thn {pegawai.masaKerjaGolonganBulan} Bln
                    </span>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => lihatDetail(pegawai.nipPegawai, "promosi")}>
                      <Eye className="mr-1.5 h-3 w-3" /> Detail
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <RenderPagination pagination={pagination} onPageChange={onPageChange} />
    </Card>
  )
}

export function SatyalancanaKaryaSatya({ items, pagination, loading, onPageChange, lihatDetail }: PropsSatyalancanaKaryaSatya) {
  return (
    <Card className="h-full min-h-[600px] flex flex-col border-border">
      <CardHeader className="pb-3 px-4 pt-4 md:px-6 md:pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg font-semibold">
              <Medal className="h-5 w-5 text-yellow-600" />
              Satyalancana Karya Satya
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Monitoring pegawai yang mendekati atau memenuhi masa kerja 10, 20, dan 30 tahun
            </CardDescription>
          </div>
          <Badge variant="secondary" className="h-fit bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {pagination.total} Pegawai
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-3 px-4 pb-4 pt-2 md:px-6 md:pb-6">
            {loading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat data...
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                Belum ada pegawai yang mendekati atau memenuhi milestone satyalancana.
              </p>
            ) : (
              items.map((pegawai) => (
                <div
                  key={pegawai.nipPegawai}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-secondary/30 p-3"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={pegawai.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(pegawai.nama)}&background=random`} />
                      <AvatarFallback>{getInitials(pegawai.nama)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{pegawai.nama}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {pegawai.golongan?.split("(")[0] ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">NIP: {pegawai.nipPegawai}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset bg-orange-50 text-orange-700 ring-orange-600/20">
                      {pegawai.kategoriSatya}
                    </span>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset ${
                      pegawai.statusSatya === "memenuhi"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-blue-50 text-blue-700 ring-blue-600/20"
                    }`}>
                      {pegawai.statusSatya === "memenuhi" ? "Memenuhi" : "Mendekati"}
                    </span>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => lihatDetail(pegawai.nipPegawai, "satyalancana")}>
                      <Eye className="mr-1.5 h-3 w-3" /> Detail
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <RenderPagination pagination={pagination} onPageChange={onPageChange} />
    </Card>
  )
}
