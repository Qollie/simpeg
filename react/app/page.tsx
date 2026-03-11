"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { KartuStatistik } from "@/components/dashboard/stat-card"
import { AktivitasTerbaru } from "@/components/dashboard/recent-activity"
import { ModalLihatPegawai } from "@/components/pegawai/view-employee-modal"
import { Users, FileText, UserCheck, Clock, MapPin } from "lucide-react"
import type { Pegawai, UpdateTerbaru } from "@/lib/types"

export default function HalamanDashboard() {
  const [stats, setStats] = useState({
    totalPegawai: 0,
    totalDokumen: 0,
    pegawaiAktif: 0,
    pegawaiCuti: 0,
  })
  const [aktivitas, setAktivitas] = useState<UpdateTerbaru[]>([])

  const [modalLihat, aturModalLihat] = useState<{
    terbuka: boolean
    pegawai: Pegawai | null
  }>({ terbuka: false, pegawai: null })

  useEffect(() => {
    let mounted = true

    fetch('/api/pegawai?per_page=200')
      .then((r) => r.json())
      .then((json) => {
        const items: any[] = json.data ?? []

        const totalPegawai = items.length
        const totalDokumen = items.reduce((sum, p) => sum + ((p.efiles ?? []).length || 0), 0)
        const pegawaiCuti = items.filter((p) => {
          const status = String(p?.status ?? p?.kepegawaian?.statusPegawai ?? '').toLowerCase()
          return status.includes('cuti')
        }).length
        const pegawaiAktif = totalPegawai - pegawaiCuti

        const aktivitasDokumen: UpdateTerbaru[] = items
          .flatMap((p) => (p.efiles ?? []).map((f: any) => ({ p, f })))
          .sort((a, b) => new Date(b.f?.waktuUpload ?? 0).getTime() - new Date(a.f?.waktuUpload ?? 0).getTime())
          .slice(0, 5)
          .map((item, index) => ({
            id: `doc-${item.f?.idFile ?? index}`,
            aksi: 'Dokumen Diunggah',
            detail: `${item.f?.jenisDokumen ?? 'Dokumen'} untuk ${item.p?.nama ?? '-'}`,
            waktu: item.f?.waktuUpload ? new Date(item.f.waktuUpload).toLocaleDateString('id-ID') : 'Baru saja',
            user: 'Sistem',
          }))

        const aktivitasPegawai: UpdateTerbaru[] = items
          .slice(0, 5)
          .map((p, index) => ({
            id: `pegawai-${p.nipPegawai ?? index}`,
            aksi: 'Data Pegawai',
            detail: `${p.nama ?? '-'} terdaftar di database`,
            waktu: 'Sinkron',
            user: 'Sistem',
          }))

        if (mounted) {
          setStats({ totalPegawai, totalDokumen, pegawaiAktif, pegawaiCuti })
          setAktivitas(aktivitasDokumen.length > 0 ? aktivitasDokumen : aktivitasPegawai)
        }
      })
      .catch(() => {
        if (mounted) {
          setStats({ totalPegawai: 0, totalDokumen: 0, pegawaiAktif: 0, pegawaiCuti: 0 })
          setAktivitas([])
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Welcome Banner - Kaltim Theme */}
        <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-3 sm:p-4 md:p-6 text-primary-foreground">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-accent/10 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary-foreground/80 text-xs sm:text-sm">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Provinsi Kalimantan Timur</span>
            </div>
            <h2 className="mt-1 sm:mt-2 text-base sm:text-lg md:text-xl font-bold">
              Selamat Datang di SIMPEG Kaltim
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-primary-foreground/80">
              Sistem Informasi Manajemen Pegawai - Arsip Kepegawaian Digital
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <KartuStatistik
            judul="Total Pegawai"
            nilai={stats.totalPegawai}
            ikon={Users}
            tren={{ nilai: "12", apakahPositif: true }}
          />
          <KartuStatistik
            judul="Total Dokumen"
            nilai={stats.totalDokumen}
            ikon={FileText}
            tren={{ nilai: "28", apakahPositif: true }}
          />
          <KartuStatistik
            judul="Pegawai Aktif"
            nilai={stats.pegawaiAktif}
            ikon={UserCheck}
            tren={{ nilai: "5", apakahPositif: true }}
          />
          <KartuStatistik
            judul="Sedang Cuti"
            nilai={stats.pegawaiCuti}
            ikon={Clock}
            tren={{ nilai: "2", apakahPositif: false }}
          />
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid gap-4 grid-cols-1 items-stretch">
          <div className="w-full">
            <AktivitasTerbaru daftarAktivitas={aktivitas} />
          </div>
        </div>

        <ModalLihatPegawai
          pegawai={modalLihat.pegawai}
          terbuka={modalLihat.terbuka}
          tutup={() => aturModalLihat({ terbuka: false, pegawai: null })}
          hapusDokumen={() => {}}
        />
      </div>
    </AdminLayout>
  )
}
