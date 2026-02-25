"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { KartuStatistik } from "@/components/dashboard/stat-card"
import { AktivitasTerbaru } from "@/components/dashboard/recent-activity"
import { ModalLihatPegawai } from "@/components/pegawai/view-employee-modal"
import { Users, FileText, UserCheck, Clock, MapPin } from "lucide-react"
import { mockStatistik, mockPegawai } from "@/lib/mock-data"
import type { Pegawai } from "@/lib/types"

export default function HalamanDashboard() {
  const [modalLihat, aturModalLihat] = useState<{
    terbuka: boolean
    pegawai: Pegawai | null
  }>({ terbuka: false, pegawai: null })

  const tanganiLihat = (pegawai: Pegawai) => {
    aturModalLihat({ terbuka: true, pegawai })
  }

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
            nilai={mockStatistik.totalPegawai}
            ikon={Users}
            tren={{ nilai: "12", apakahPositif: true }}
          />
          <KartuStatistik
            judul="Total Dokumen"
            nilai={mockStatistik.totalDokumen}
            ikon={FileText}
            tren={{ nilai: "28", apakahPositif: true }}
          />
          <KartuStatistik
            judul="Pegawai Aktif"
            nilai={mockStatistik.pegawaiAktif}
            ikon={UserCheck}
            tren={{ nilai: "5", apakahPositif: true }}
          />
          <KartuStatistik
            judul="Sedang Cuti"
            nilai={mockStatistik.pegawaiCuti}
            ikon={Clock}
            tren={{ nilai: "2", apakahPositif: false }}
          />
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid gap-4 grid-cols-1 items-stretch">
          <div className="w-full">
            <AktivitasTerbaru daftarAktivitas={mockStatistik.updateTerbaru} />
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
