"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Briefcase, Medal, Eye, TrendingUp } from "lucide-react"
import type { Pegawai } from "@/lib/types"
import { golonganList } from "@/lib/mock-data"

interface PropsKelayakanKenaikanPangkat {
  daftarPegawai: Pegawai[]
  lihatDetail: (pegawai: Pegawai, konteks: 'promosi' | 'satyalancana') => void
}

// Mapping Batas Pangkat Tertinggi berdasarkan Pendidikan (Contoh Aturan)
const batasPangkatPendidikan: Record<string, string> = {
  "SMA": "Pengatur Tingkat I (II/d)",
  "D3": "Penata Tingkat I (III/d)",
  "D4": "Pembina (IV/a)",
  "S1": "Pembina (IV/a)",
  "S2": "Pembina Utama Madya (IV/d)",
  "S3": "Pembina Utama (IV/e)",
}

const statusNonAktif = ["cuti", "pensiun", "nonaktif", "resign"]

const normalisasiPendidikan = (pegawai: Pegawai): string => {
  const pAny = pegawai as any
  const raw = (pAny?.pendidikanTerakhir ?? pAny?.kepegawaian?.pendidikanTerakhir ?? "").toString().trim().toUpperCase()

  if (["SMA", "SMK"].includes(raw)) return "SMA"
  if (["D3", "DIPLOMA 3", "DIPLOMA III"].includes(raw)) return "D3"
  if (["D4", "DIPLOMA 4", "DIPLOMA IV"].includes(raw)) return "D4"
  if (["S1", "STRATA 1"].includes(raw)) return "S1"
  if (["S2", "STRATA 2"].includes(raw)) return "S2"
  if (["S3", "STRATA 3"].includes(raw)) return "S3"

  return "S1"
}

const ambilTmtGolonganAktif = (pegawai: Pegawai): string | undefined => {
  const pAny = pegawai as any
  const riwayatTerbaru = [...(pegawai.riwayatPangkat ?? [])]
    .sort((a, b) => new Date(b?.tmtPangkat ?? 0).getTime() - new Date(a?.tmtPangkat ?? 0).getTime())[0]

  return (
    riwayatTerbaru?.tmtPangkat
    ?? pAny?.tmtGolongan
    ?? pegawai.tanggalMasuk
    ?? pegawai.kepegawaian?.tmtCpns
    ?? pegawai.kepegawaian?.tmtPns
  )
}

const hitungMasaKerja = (tanggalAwal?: string) => {
  if (!tanggalAwal) return { tahun: 0, bulan: 0 }

  const mulai = new Date(tanggalAwal)
  if (Number.isNaN(mulai.getTime())) return { tahun: 0, bulan: 0 }

  const sekarang = new Date()
  let tahun = sekarang.getFullYear() - mulai.getFullYear()
  let bulan = sekarang.getMonth() - mulai.getMonth()

  if (bulan < 0 || (bulan === 0 && sekarang.getDate() < mulai.getDate())) {
    tahun -= 1
    bulan += 12
  }

  return { tahun, bulan }
}

const formatTanggalIndonesia = (date: Date) =>
  date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })

export function KelayakanKenaikanPangkat({ daftarPegawai, lihatDetail }: PropsKelayakanKenaikanPangkat) {
  const statusAktif = (status?: string) => {
    const nilai = (status ?? '').toString().trim().toLowerCase()
    if (!nilai) return true

    return !statusNonAktif.includes(nilai)
  }

  const isMaxRankReached = (golonganSaatIni: string, pendidikan: string) => {
    if (!pendidikan || !batasPangkatPendidikan[pendidikan]) return false 
    
    const maxRank = batasPangkatPendidikan[pendidikan]
    const currentIndex = golonganList.indexOf(golonganSaatIni)
    const maxIndex = golonganList.indexOf(maxRank)

    return currentIndex >= maxIndex
  }

  const getInfoKelayakanPangkat = (tmtGolongan?: string): { layak: boolean; keterangan: string } => {
    if (!tmtGolongan) return { layak: false, keterangan: "TMT golongan belum tersedia" }

    const mulai = new Date(tmtGolongan)
    if (Number.isNaN(mulai.getTime())) return { layak: false, keterangan: "TMT golongan tidak valid" }

    const target = new Date(mulai)
    target.setFullYear(target.getFullYear() + 4)

    const sekarang = new Date()
    const layak = sekarang.getTime() >= target.getTime()

    if (layak) {
      return { layak: true, keterangan: `Layak sejak ${formatTanggalIndonesia(target)}` }
    }

    return { layak: false, keterangan: `Memenuhi syarat pada ${formatTanggalIndonesia(target)}` }
  }

  const pegawaiLayak = daftarPegawai
    .map((p) => {
      const tmtGolonganAktif = ambilTmtGolonganAktif(p)
      const { tahun, bulan } = hitungMasaKerja(tmtGolonganAktif)
      const pendidikan = normalisasiPendidikan(p)
      const isMentok = isMaxRankReached(p.golongan || '', pendidikan)
      const infoKelayakan = getInfoKelayakanPangkat(tmtGolonganAktif)
      const layakNaikPangkat = infoKelayakan.layak && !isMentok

      return {
        ...p,
        tmtGolonganAktif,
        masaKerjaGolonganTahun: tahun,
        masaKerjaGolonganBulan: bulan,
        pendidikan,
        layakNaikPangkat,
        keterangan: infoKelayakan.keterangan,
      }
    })
    .filter((p) => statusAktif(p.status) && p.layakNaikPangkat)
    .sort((a, b) => {
      if (b.masaKerjaGolonganTahun !== a.masaKerjaGolonganTahun) {
        return b.masaKerjaGolonganTahun - a.masaKerjaGolonganTahun
      }

      return b.masaKerjaGolonganBulan - a.masaKerjaGolonganBulan
    })

  return (
    <Card className="h-full min-h-[600px] flex flex-col border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
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
            {pegawaiLayak.length} Pegawai
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-3 px-4 pb-4 pt-2 md:px-6 md:pb-6">
            {pegawaiLayak.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada pegawai yang memenuhi syarat saat ini.
              </p>
            ) : (
              pegawaiLayak.map((pegawai) => (
                <div
                  key={pegawai.nipPegawai}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-md border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pegawai.nama)}&background=random`} 
                      />
                      <AvatarFallback>PG</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{pegawai.nama}</p>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {pegawai.golongan?.split('(')[0]}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1 font-medium">
                          <TrendingUp className="h-3 w-3" />
                          {pegawai.keterangan}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">NIP: {pegawai.nipPegawai}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
                      Masa Kerja Gol: {pegawai.masaKerjaGolonganTahun} Thn {pegawai.masaKerjaGolonganBulan} Bln
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={() => lihatDetail(pegawai, 'promosi')}
                    >
                      <Eye className="mr-1.5 h-3 w-3" />
                      Detail
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function SatyalancanaKaryaSatya({ daftarPegawai, lihatDetail }: PropsKelayakanKenaikanPangkat) {
  const statusAktif = (status?: string) => {
    const nilai = (status ?? '').toString().trim().toLowerCase()
    if (!nilai) return true

    return !statusNonAktif.includes(nilai)
  }

  const milestones = [10, 20, 30]

  const pegawaiSenior = daftarPegawai
    .map((p) => {
      const tmtMasuk = p.tanggalMasuk ?? p.kepegawaian?.tmtCpns ?? p.kepegawaian?.tmtPns
      const { tahun, bulan } = hitungMasaKerja(tmtMasuk)

      const tercapai = milestones.filter((m) => tahun >= m).at(-1)
      const berikutnya = milestones.find((m) => tahun < m)

      let kategoriSatya = ""
      let statusSatya: "Memenuhi" | "Mendekati" | "Belum" = "Belum"

      if (tercapai) {
        statusSatya = "Memenuhi"
        kategoriSatya = `${tercapai} Tahun`
      } else if (berikutnya) {
        const sisaTahun = berikutnya - tahun
        if (sisaTahun === 0 || (sisaTahun === 1 && bulan >= 0)) {
          statusSatya = "Mendekati"
          kategoriSatya = `Menuju ${berikutnya} Tahun`
        }
      }

      return {
        ...p,
        masaKerjaTahun: tahun,
        masaKerjaBulan: bulan,
        kategoriSatya,
        statusSatya,
      }
    })
    .filter((p) => statusAktif(p.status) && p.statusSatya !== "Belum")
    .sort((a, b) => {
      if (a.statusSatya !== b.statusSatya) {
        return a.statusSatya === "Memenuhi" ? -1 : 1
      }

      if (b.masaKerjaTahun !== a.masaKerjaTahun) {
        return b.masaKerjaTahun - a.masaKerjaTahun
      }

      return b.masaKerjaBulan - a.masaKerjaBulan
    })

  return (
    <Card className="h-full min-h-[600px] flex flex-col border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
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
            {pegawaiSenior.length} Pegawai
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-3 px-4 pb-4 pt-2 md:px-6 md:pb-6">
            {pegawaiSenior.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                Belum ada pegawai yang mencapai masa kerja 10, 20, atau 30 tahun.
              </p>
            ) : (
              pegawaiSenior.map((pegawai) => (
                <div
                  key={pegawai.nipPegawai}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-secondary/30 p-3 transition-all duration-300 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pegawai.nama)}&background=random`} 
                      />
                      <AvatarFallback>PG</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{pegawai.nama}</p>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {pegawai.golongan?.split('(')[0]}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">NIP: {pegawai.nipPegawai}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset
                      ${pegawai.masaKerjaTahun >= 30 ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' : 
                        pegawai.masaKerjaTahun >= 20 ? 'bg-slate-100 text-slate-700 ring-slate-600/20' : 
                        'bg-orange-50 text-orange-700 ring-orange-600/20'}
                    `}>
                      {pegawai.kategoriSatya}
                    </span>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset ${
                      pegawai.statusSatya === 'Memenuhi'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                        : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                    }`}>
                      {pegawai.statusSatya}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={() => lihatDetail(pegawai, 'satyalancana')}
                    >
                      <Eye className="mr-1.5 h-3 w-3" />
                      Detail
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}