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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const DEFAULT_PAGINATION: PaginationMeta = {
  currentPage: 1,
  lastPage: 1,
  total: 0,
}

type KarirProcessStatusItem = {
  id: number
  nipPegawai: string
  nama: string
  golongan: string | null
  cycleNumber: number
  tmtGolonganDasar: string | null
  eligibleDate: string | null
  status: boolean
  processedAt: string | null
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
  const identitasSrc = p.identitasResmi ?? p.identitas_resmi ?? {}
  const riwayatTerbaru = [...(p.riwayatPangkat ?? [])]
    .sort((a: any, b: any) => new Date(b?.tmtPangkat ?? 0).getTime() - new Date(a?.tmtPangkat ?? 0).getTime())[0]

  const pangkatTerbaru = riwayatTerbaru?.pangkat

  return {
    ...p,
    identitasResmi: {
      nipIdResmi: identitasSrc.nipIdResmi ?? identitasSrc.nip_id_resmi ?? p.nipPegawai ?? "",
      nik: identitasSrc.nik ?? "",
      noBpjs: identitasSrc.noBpjs ?? identitasSrc.no_bpjs ?? "",
      noNpwp: identitasSrc.noNpwp ?? identitasSrc.no_npwp ?? "",
      karpeg: identitasSrc.karpeg ?? "",
      karsuKarsi: identitasSrc.karsuKarsi ?? identitasSrc.karsu_karsi ?? "",
      taspen: identitasSrc.taspen ?? "",
    },
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
  const [promotionRefreshKey, setPromotionRefreshKey] = useState(0)
  const [processRefreshKey, setProcessRefreshKey] = useState(0)

  const [promotionLoading, setPromotionLoading] = useState(false)
  const [satyaLoading, setSatyaLoading] = useState(false)

  const [promotionItems, setPromotionItems] = useState<PromotionEligibilityItem[]>([])
  const [satyaItems, setSatyaItems] = useState<SatyalancanaItem[]>([])

  const [promotionPagination, setPromotionPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION)
  const [satyaPagination, setSatyaPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION)
  const [processLoading, setProcessLoading] = useState(false)
  const [processItems, setProcessItems] = useState<KarirProcessStatusItem[]>([])
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
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)

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

        const mapped: PromotionEligibilityItem[] = items.map((p: any) => {
          const identitas = p.identitasResmi ?? p.identitas_resmi ?? {}
          const kepegawaianRaw = p.kepegawaian ?? {}
          const riwayatPangkatRaw = p.riwayatPangkat ?? p.riwayat_pangkat ?? []

          const kepegawaian = {
            ...kepegawaianRaw,
            statusPegawai: kepegawaianRaw.statusPegawai ?? "",
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
            masaKerjaGolonganTahun: Number(p.masaKerjaGolonganTahun ?? p.masaKerjaGolonganTahun ?? 0),
            masaKerjaGolonganBulan: Number(p.masaKerjaGolonganBulan ?? p.masaKerjaGolonganBulan ?? 0),
          }
        })

        setPromotionItems(mapped)
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
  }, [promotionPage, perPage, nearYears, searchQuery, promotionRefreshKey])

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
    params.set("page", String(promotionPage))
    params.set("per_page", perPage)
    if (searchQuery.trim()) params.set("q", searchQuery.trim())

    setProcessLoading(true)

    fetch(`/api/karir/status-proses?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        setProcessItems(json.data ?? [])
      })
      .catch(() => {
        if (!mounted) return
        setProcessItems([])
      })
      .finally(() => {
        if (mounted) setProcessLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [promotionPage, perPage, searchQuery, processRefreshKey])

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
  }, [searchQuery, nearYears, promotionRefreshKey])

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

  const handleChangeProcessStatus = async (item: KarirProcessStatusItem, status: boolean) => {
    try {
      const response = await fetch(`/api/karir/status-proses/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Gagal memperbarui status proses")
      }

      setProcessRefreshKey((k) => k + 1)
      if (status) {
        setPromotionRefreshKey((k) => k + 1)
      }
    } catch {
      // Keep UI unchanged when request fails
    }
  }

  const handleSyncProcessTable = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set("q", searchQuery.trim())

      const response = await fetch(`/api/karir/status-proses/sync?${params.toString()}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Gagal menyinkronkan data status proses")
      }

      setProcessRefreshKey((k) => k + 1)
      setPromotionRefreshKey((k) => k + 1)
      setSyncDialogOpen(false)
    } catch {
      // Keep UI unchanged when request fails
    }
  }

  const formatTanggal = (value: string | null): string => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
  }

  const processStatusBadgeClass = (status: boolean) =>
    status
      ? "border-green-200 bg-green-100 text-green-700"
      : "border-amber-200 bg-amber-100 text-amber-700"

  const processStatusSelectClass = (status: boolean) =>
    status
      ? "h-9 rounded-md border-green-200 bg-green-50/70 text-green-700"
      : "h-9 rounded-md border-amber-200 bg-amber-50/70 text-amber-700"

  const processStatusLabel = (status: boolean) => (status ? "Sudah Diproses" : "Belum Diproses")

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
            {/* Tombol unduh CSV dihapus sesuai permintaan */}
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

        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold tracking-tight">Status Proses Karir</p>
              <p className="mt-1 text-xs text-muted-foreground">Pantau progres pemrosesan karir per pegawai.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full border-border/70 bg-muted/40 px-2.5 py-1 text-[11px]">
                {processItems.length} data
              </Badge>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSyncDialogOpen(true)}>
                Sync
              </Button>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/35">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">NIP</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Nama Pegawai</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pangkat / Golongan</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Siklus</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tanggal Siklus</TableHead>
                  <TableHead className="w-[240px] text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status Proses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                      Memuat status proses...
                    </TableCell>
                  </TableRow>
                ) : processItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                      Data status proses belum tersedia.
                    </TableCell>
                  </TableRow>
                ) : (
                  processItems.map((item) => (
                    <TableRow key={item.id} className="transition-colors hover:bg-muted/25">
                      <TableCell className="font-mono text-[12px]">{item.nipPegawai}</TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.golongan ?? "-"}</TableCell>
                      <TableCell className="text-xs">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">Siklus {item.cycleNumber}</p>
                          <p className="text-muted-foreground">Konfirmasi kenaikan pangkat ke-{item.cycleNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="space-y-1">
                          <p>TMT dasar: {formatTanggal(item.tmtGolonganDasar)}</p>
                          <p>Layak sejak: {formatTanggal(item.eligibleDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.status ? (
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className={`rounded-full text-[11px] ${processStatusBadgeClass(item.status)}`}>
                              {processStatusLabel(item.status)}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground">Diproses pada {formatTanggal(item.processedAt)}</p>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <Select
                              value={String(item.status)}
                              onValueChange={(value) => handleChangeProcessStatus(item, value === "true")}
                            >
                              <SelectTrigger className={`w-[160px] text-xs ${processStatusSelectClass(item.status)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="false">Belum Diproses</SelectItem>
                                <SelectItem value="true">Sudah Diproses</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <ModalLihatPegawai
        pegawai={modalLihat.pegawai}
        terbuka={modalLihat.terbuka}
        tutup={() => setModalLihat({ terbuka: false, pegawai: null, konteks: null })}
        hapusDokumen={() => {}}
      />

      <AlertDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Konfirmasi Sync</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Sinkronkan data status proses karir untuk menampilkan siklus yang sudah jatuh tempo tetapi belum tercatat?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80">Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSyncProcessTable}>
              Sync Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
