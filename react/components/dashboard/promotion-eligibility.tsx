"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Briefcase, Medal, Eye, TrendingUp, AlertCircle } from "lucide-react"
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

export function KelayakanKenaikanPangkat({ daftarPegawai, lihatDetail }: PropsKelayakanKenaikanPangkat) {
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

  // Helper: Cek apakah golongan saat ini sudah mentok pendidikan
  const isMaxRankReached = (golonganSaatIni: string, pendidikan: string) => {
    if (!pendidikan || !batasPangkatPendidikan[pendidikan]) return false 
    
    const maxRank = batasPangkatPendidikan[pendidikan]
    const currentIndex = golonganList.indexOf(golonganSaatIni)
    const maxIndex = golonganList.indexOf(maxRank)

    return currentIndex >= maxIndex
  }

  // Helper: Hitung estimasi kenaikan pangkat berikutnya
  const getEstimasiNaikPangkat = (tmtGolongan: string): string => {
    if (!tmtGolongan) return "TMT Golongan tidak valid";
    
    const tmtDate = new Date(tmtGolongan);
    if (isNaN(tmtDate.getTime())) return "TMT Golongan tidak valid";

    const targetDate = new Date(tmtGolongan);
    targetDate.setFullYear(targetDate.getFullYear() + 4);

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const targetDay = targetDate.getDate();

    let estimasiTahunFinal = targetYear;
    let estimasiBulanFinal = "April";

    if (targetMonth > 9 || (targetMonth === 9 && targetDay > 1)) { // Setelah 1 Oktober
        estimasiTahunFinal = targetYear + 1;
        estimasiBulanFinal = "April";
    } else if (targetMonth > 3 || (targetMonth === 3 && targetDay > 1)) { // Setelah 1 April
        estimasiTahunFinal = targetYear;
        estimasiBulanFinal = "Oktober";
    }
    
    return `Estimasi ${estimasiBulanFinal} ${estimasiTahunFinal}`;
  };

  const pegawaiLayak = daftarPegawai
    .map((p) => {
      const pAny = p as any
      const tmtGolongan = pAny.tmtGolongan || p.tanggalMasuk; // Fallback ke tanggalMasuk
      const { tahun, bulan } = hitungMasaKerja(tmtGolongan || '')
      const pendidikan = pAny.pendidikanTerakhir || "S1" // Default S1 jika data kosong
      const isMentok = isMaxRankReached(p.golongan || '', pendidikan);
      const layakNaikPangkat = tahun >= 4 && !isMentok;

      let saran = "";
      if (isMentok) {
        saran = "Telah mencapai batas maksimal pendidikan.";
      } else if (layakNaikPangkat) {
        saran = getEstimasiNaikPangkat(tmtGolongan);
      }

      return {
        ...p,
        masaKerjaGolonganTahun: tahun,
        masaKerjaGolonganBulan: bulan,
        pendidikan,
        isMentok,
        layakNaikPangkat,
        saran,
      }
    })
    // Syarat: Aktif, dan (sudah mentok ATAU sudah layak naik pangkat)
    .filter((p) => p.status === "Aktif" && (p.isMentok || p.layakNaikPangkat))
    .sort((a, b) => {
      // Prioritaskan yang layak, lalu yang mentok. Kemudian sort by masa kerja.
      if (a.layakNaikPangkat && !b.layakNaikPangkat) return -1;
      if (!a.layakNaikPangkat && b.layakNaikPangkat) return 1;
      return b.masaKerjaGolonganTahun - a.masaKerjaGolonganTahun;
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
              Masa kerja ≥ 4 tahun & memenuhi syarat pendidikan
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
                  className={`flex items-start justify-between gap-3 rounded-lg border p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                    pegawai.layakNaikPangkat
                      ? "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                      : "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                  }`}
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
                        {pegawai.isMentok ? (
                          <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1 font-medium">
                            <AlertCircle className="h-3 w-3" />
                            {pegawai.saran}
                          </p>
                        ) : (
                          <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1 font-medium">
                            <TrendingUp className="h-3 w-3" />
                            {pegawai.saran}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">NIP: {pegawai.nipPegawai}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
                      Masa Kerja Gol: {pegawai.masaKerjaGolonganTahun} Thn
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

  const pegawaiSenior = daftarPegawai
    .map((p) => {
      const { tahun, bulan } = hitungMasaKerja(p.tanggalMasuk || '')
      
      let kategori = null
      if (tahun >= 30) kategori = "30 Thn (Emas)"
      else if (tahun >= 20) kategori = "20 Thn (Perak)"
      else if (tahun >= 10) kategori = "10 Thn (Perunggu)"

      return {
        ...p,
        masaKerjaTahun: tahun,
        masaKerjaBulan: bulan,
        kategoriSatya: kategori
      }
    })
    // Syarat: Mencapai 10, 20, atau 30 tahun
    .filter((p) => p.kategoriSatya !== null && p.status === "Aktif")
    .sort((a, b) => b.masaKerjaTahun - a.masaKerjaTahun)

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
              Penghargaan pengabdian 10, 20, dan 30 Tahun
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