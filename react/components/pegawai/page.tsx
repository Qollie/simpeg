"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import {
  KelayakanKenaikanPangkat,
  SatyalancanaKaryaSatya,
  type PaginationMeta,
  type PromotionEligibilityItem,
  type SatyalancanaItem,
} from "@/components/dashboard/promotion-eligibility"
import { ModalLihatPegawai } from "@/components/pegawai/view-employee-modal"
import type { Pegawai } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download } from "lucide-react"

const DEFAULT_PAGINATION: PaginationMeta = {
  currentPage: 1,
  lastPage: 1,
  total: 0,
}

// Normalize status coming from various API fields/casing
const normalisasiStatusKarir = (p: any): string => {
  const raw = (p?.status ?? p?.kepegawaian?.statusPegawai ?? "Aktif") as string
  const lower = raw.toLowerCase()
  if (["aktif", "active"].includes(lower)) return "Aktif"
  if (["cuti"].includes(lower)) return "Cuti"
  if (["pensiun", "resign", "berhenti", "nonaktif"].includes(lower)) return "Nonaktif"
  return raw || "Aktif"
}

const mapPegawaiForModal = (p: any): Pegawai => {
  const riwayatTerbaru = [...(p.riwayatPangkat ?? [])]
    .sort((a: any, b: any) => new Date(b?.tmtPangkat ?? 0).getTime() - new Date(a?.tmtPangkat ?? 0).getTime())[0]

  const pangkatTerbaru = riwayatTerbaru?.pangkat

  return {
    ...p,
    departemen: p.kepegawaian?.jenisPegawai ?? p.departemen,
    status: p.status ?? p.kepegawaian?.statusPegawai ?? "Aktif",
    tanggalMasuk: p.tanggalMasuk ?? p.kepegawaian?.tmtCpns ?? p.kepegawaian?.tmtPns,
    golongan: pangkatTerbaru
      ? `${pangkatTerbaru.pangkat ?? ""} (${pangkatTerbaru.golongan ?? ""})`.trim()
      : p.golongan,
    riwayatPangkat: (p.riwayatPangkat ?? []).map((r: any) => ({
      ...r,
      status: typeof r.status === "boolean" ? (r.status ? "Berlaku" : "Selesai") : r.status,
      pangkat: r.pangkat
        ? {
            idPangkat: r.pangkat.idPangkat,
            namaPangkat: `${r.pangkat.pangkat ?? ""} (${r.pangkat.golongan ?? ""})`.trim(),
          }
        : undefined,
    })),
  }
}

export default function KarirPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [satyaStatus, setSatyaStatus] = useState("semua")
  const [nearYears, setNearYears] = useState("1")
  const [perPage, setPerPage] = useState("10")

  const [promotionPage, setPromotionPage] = useState(1)
  const [satyaPage, setSatyaPage] = useState(1)

  const [promotionLoading, setPromotionLoading] = useState(false)
  const [satyaLoading, setSatyaLoading] = useState(false)

  const [promotionItems, setPromotionItems] = useState<PromotionEligibilityItem[]>([])
  const [satyaItems, setSatyaItems] = useState<SatyalancanaItem[]>([])

  const [promotionPagination, setPromotionPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION)
  const [satyaPagination, setSatyaPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION)
  const [careerSummary, setCareerSummary] = useState({
    promotionTotal: 0,
    satyalancanaTotal: 0,
    satyalancanaMemenuhi: 0,
    satyalancanaMendekati: 0,
  })

  const [modalLihat, setModalLihat] = useState<{
    terbuka: boolean
    pegawai: Pegawai | null
    konteks: "promosi" | "satyalancana" | null
  }>({ terbuka: false, pegawai: null, konteks: null })

  useEffect(() => {
    setPromotionPage(1)
    setSatyaPage(1)
  }, [searchQuery, satyaStatus, nearYears, perPage])

  useEffect(() => {
    let mounted = true
    const params = new URLSearchParams()
    params.set("page", String(promotionPage))
    params.set("per_page", perPage)
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    params.set("near_years", nearYears)

    setPromotionLoading(true)

    fetch(`/api/karir/naik-pangkat?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        const items: any[] = json.data ?? []

        const mapped: Pegawai[] = items.map((p: any) => {
          const identitas = p.identitasResmi ?? p.identitas_resmi ?? {}
          const kepegawaianRaw = p.kepegawaian ?? {}
          const riwayatPangkatRaw = p.riwayatPangkat ?? p.riwayat_pangkat ?? []

          const kepegawaian = {
            ...kepegawaianRaw,
            statusPegawai: kepegawaianRaw.statusPegawai ?? p.status ?? "Aktif",
            jenisPegawai: kepegawaianRaw.jenisPegawai ?? p.departemen ?? "-",
            tmtCpns: kepegawaianRaw.tmtCpns ?? p.tmtCpns ?? p.tanggalMasuk ?? null,
            tmtPns: kepegawaianRaw.tmtPns ?? p.tmtPns ?? null,
            masaKerjaTahun: kepegawaianRaw.masaKerjaTahun ?? p.masaKerjaTahun ?? 0,
            masaKerjaBulan: kepegawaianRaw.masaKerjaBulan ?? p.masaKerjaBulan ?? 0,
          }

          const riwayatTerbaru = [...riwayatPangkatRaw]
            .sort((a: any, b: any) => new Date(b?.tmtPangkat ?? 0).getTime() - new Date(a?.tmtPangkat ?? 0).getTime())[0]

          const pangkatTerbaru = riwayatTerbaru?.pangkat
          const golongan = pangkatTerbaru ? `${pangkatTerbaru.pangkat ?? ""} (${pangkatTerbaru.golongan ?? ""})`.trim() : p.golongan

          return {
            ...p,
            identitasResmi: {
              nipIdResmi: identitas.nipIdResmi ?? p.nipPegawai,
              nik: identitas.nik ?? "",
              noBpjs: identitas.noBpjs ?? "",
              noNpwp: identitas.noNpwp ?? "",
              karpeg: identitas.karpeg ?? "",
              karsuKarsi: identitas.karsuKarsi ?? "",
              taspen: identitas.taspen ?? "",
            },
            kepegawaian,
            riwayatPangkat: riwayatPangkatRaw,
            departemen: kepegawaian.jenisPegawai,
            status: normalisasiStatusKarir({ ...p, status: p.status ?? kepegawaian.statusPegawai, kepegawaian }),
            tanggalMasuk: p.tanggalMasuk ?? kepegawaian.tmtCpns ?? kepegawaian.tmtPns,
            golongan,
            tmtGolongan: riwayatTerbaru?.tmtPangkat ?? p.tanggalMasuk ?? kepegawaian.tmtCpns ?? kepegawaian.tmtPns,
          }
        })

        setPromotionItems(mapped as PromotionEligibilityItem[])
        setPromotionPagination({
          currentPage: json.current_page ?? 1,
          lastPage: json.last_page ?? 1,
          total: json.total ?? 0,
        })
      })
      .catch(() => {
        if (!mounted) return
        setPromotionItems([])
        setPromotionPagination(DEFAULT_PAGINATION)
      })
      .finally(() => {
        if (mounted) setPromotionLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [promotionPage, perPage, nearYears, searchQuery])

  useEffect(() => {
    let mounted = true
    const params = new URLSearchParams()
    params.set("page", String(satyaPage))
    params.set("per_page", perPage)
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    if (satyaStatus !== "semua") params.set("status", satyaStatus)
    params.set("near_years", nearYears)

    setSatyaLoading(true)

    fetch(`/api/karir/satyalancana?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        setSatyaItems(json.data ?? [])
        setSatyaPagination({
          currentPage: json.current_page ?? 1,
          lastPage: json.last_page ?? 1,
          total: json.total ?? 0,
        })
      })
      .catch(() => {
        if (!mounted) return
        setSatyaItems([])
        setSatyaPagination(DEFAULT_PAGINATION)
      })
      .finally(() => {
        if (mounted) setSatyaLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [satyaPage, perPage, satyaStatus, nearYears, searchQuery])

  useEffect(() => {
    let mounted = true

    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    params.set("near_years", nearYears)

    fetch(`/api/karir/summary?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        setCareerSummary({
          promotionTotal: json.promotionTotal ?? 0,
          satyalancanaTotal: json.satyalancanaTotal ?? 0,
          satyalancanaMemenuhi: json.satyalancanaMemenuhi ?? 0,
          satyalancanaMendekati: json.satyalancanaMendekati ?? 0,
        })
      })
      .catch(() => {
        if (!mounted) return
        setCareerSummary({
          promotionTotal: 0,
          satyalancanaTotal: 0,
          satyalancanaMemenuhi: 0,
          satyalancanaMendekati: 0,
        })
      })

    return () => {
      mounted = false
    }
  }, [searchQuery, nearYears])

  const handleLihatDetail = (nip: string, konteks: "promosi" | "satyalancana") => {
    fetch(`/api/pegawai/${nip}`)
      .then((r) => r.json())
      .then((json) => {
        const pegawai = mapPegawaiForModal(json)
        setModalLihat({ terbuka: true, pegawai, konteks })
      })
      .catch(() => {
        setModalLihat({ terbuka: false, pegawai: null, konteks: null })
      })
  }

  const summaryText = useMemo(() => {
    return `Naik pangkat: ${careerSummary.promotionTotal} pegawai | Satyalancana: ${careerSummary.satyalancanaTotal} pegawai`
  }, [careerSummary.promotionTotal, careerSummary.satyalancanaTotal])

  const handleDownloadPromotionCsv = () => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    params.set("near_years", nearYears)

    window.open(`/api/karir/naik-pangkat/export?${params.toString()}`, "_blank")
  }

  const handleDownloadSatyaCsv = () => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    if (satyaStatus !== "semua") params.set("status", satyaStatus)
    params.set("near_years", nearYears)

    window.open(`/api/karir/satyalancana/export?${params.toString()}`, "_blank")
  }

  return (
    <AdminLayout title="Peningkatan Karir">
      <div className="space-y-4 md:space-y-6">
        <div className="rounded-lg border border-border/60 bg-card p-3 md:p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input
              placeholder="Cari nama, NIP, atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={satyaStatus} onValueChange={setSatyaStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter status satyalancana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Satyalancana: Semua</SelectItem>
                <SelectItem value="memenuhi">Satyalancana: Memenuhi</SelectItem>
                <SelectItem value="mendekati">Satyalancana: Mendekati</SelectItem>
              </SelectContent>
            </Select>
            <Select value={perPage} onValueChange={setPerPage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Data per halaman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per halaman</SelectItem>
                <SelectItem value="25">25 per halaman</SelectItem>
                <SelectItem value="50">50 per halaman</SelectItem>
              </SelectContent>
            </Select>
            <Select value={nearYears} onValueChange={setNearYears}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rentang mendekati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Mendekati: maksimal 1 tahun</SelectItem>
                <SelectItem value="2">Mendekati: maksimal 2 tahun</SelectItem>
                <SelectItem value="3">Mendekati: maksimal 3 tahun</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Layak Naik Pangkat</p>
              <p className="text-sm font-semibold">{careerSummary.promotionTotal}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Satyalancana Total</p>
              <p className="text-sm font-semibold">{careerSummary.satyalancanaTotal}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Satyalancana Memenuhi</p>
              <p className="text-sm font-semibold">{careerSummary.satyalancanaMemenuhi}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Satyalancana Mendekati</p>
              <p className="text-sm font-semibold">{careerSummary.satyalancanaMendekati}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPromotionCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Unduh CSV Naik Pangkat
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadSatyaCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Unduh CSV Satyalancana
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{summaryText}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <KelayakanKenaikanPangkat
            items={promotionItems}
            pagination={promotionPagination}
            loading={promotionLoading}
            onPageChange={setPromotionPage}
            lihatDetail={handleLihatDetail}
          />
          <SatyalancanaKaryaSatya
            items={satyaItems}
            pagination={satyaPagination}
            loading={satyaLoading}
            onPageChange={setSatyaPage}
            lihatDetail={handleLihatDetail}
          />
        </div>
      </div>

      <ModalLihatPegawai
        pegawai={modalLihat.pegawai}
        terbuka={modalLihat.terbuka}
        tutup={() => setModalLihat({ terbuka: false, pegawai: null, konteks: null })}
        hapusDokumen={() => {}}
      />
    </AdminLayout>
  )
}
