"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { KelayakanKenaikanPangkat, SatyalancanaKaryaSatya } from "@/components/dashboard/promotion-eligibility"
import { ModalLihatPegawai } from "@/components/pegawai/view-employee-modal"
import { mockPegawai } from "@/lib/mock-data"
import type { Pegawai } from "@/lib/types"

export default function KarirPage() {
  const [modalLihat, aturModalLihat] = useState<{
    terbuka: boolean
    pegawai: Pegawai | null,
    konteks: 'promosi' | 'satyalancana' | null
  }>({ terbuka: false, pegawai: null, konteks: null })

  const tanganiLihat = (pegawai: Pegawai, konteks: 'promosi' | 'satyalancana') => {
    aturModalLihat({ terbuka: true, pegawai, konteks })
  }

  return (
    <AdminLayout title="Peningkatan Karir">
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <KelayakanKenaikanPangkat 
          daftarPegawai={mockPegawai} 
          lihatDetail={tanganiLihat} 
        />
        <SatyalancanaKaryaSatya 
          daftarPegawai={mockPegawai} 
          lihatDetail={tanganiLihat} 
        />
      </div>

      <ModalLihatPegawai
        pegawai={modalLihat.pegawai}
        terbuka={modalLihat.terbuka}
        tutup={() => aturModalLihat({ terbuka: false, pegawai: null, konteks: null })}
        hapusDokumen={() => {}}
      />
    </AdminLayout>
  )
}