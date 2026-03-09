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

const DEFAULT_PAGINATION: PaginationMeta = {
  currentPage: 1,
  lastPage: 1,
  total: 0,
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
  const [perPage, setPerPage] = useState("10")

  const [promotionPage, setPromotionPage] = useState(1)
  const [satyaPage, setSatyaPage] = useState(1)

  const [promotionLoading, setPromotionLoading] = useState(false)
  const [satyaLoading, setSatyaLoading] = useState(false)

  const [promotionItems, setPromotionItems] = useState<PromotionEligibilityItem[]>([])
  const [satyaItems, setSatyaItems] = useState<SatyalancanaItem[]>([])

  const [promotionPagination, setPromotionPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION)
  const [satyaPagination, setSatyaPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION)

  const [modalLihat, setModalLihat] = useState<{
    terbuka: boolean
    pegawai: Pegawai | null
    konteks: "promosi" | "satyalancana" | null
  }>({ terbuka: false, pegawai: null, konteks: null })

  useEffect(() => {
    setPromotionPage(1)
    setSatyaPage(1)
  }, [searchQuery, satyaStatus, perPage])

  useEffect(() => {
    let mounted = true
    const params = new URLSearchParams()
    params.set("page", String(promotionPage))
    params.set("per_page", perPage)
    if (searchQuery.trim()) params.set("q", searchQuery.trim())

    setPromotionLoading(true)

    fetch(`/api/karir/naik-pangkat?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        setPromotionItems(json.data ?? [])
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
  }, [promotionPage, perPage, searchQuery])

  useEffect(() => {
    let mounted = true
    const params = new URLSearchParams()
    params.set("page", String(satyaPage))
    params.set("per_page", perPage)
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    if (satyaStatus !== "semua") params.set("status", satyaStatus)

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
  }, [satyaPage, perPage, satyaStatus, searchQuery])

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
    return `Naik pangkat: ${promotionPagination.total} pegawai | Satyalancana: ${satyaPagination.total} pegawai`
  }, [promotionPagination.total, satyaPagination.total])

  return (
    <AdminLayout title="Peningkatan Karir">
      <div className="space-y-4 md:space-y-6">
        <div className="rounded-lg border border-border/60 bg-card p-3 md:p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
