"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { KelayakanKenaikanPangkat, SatyalancanaKaryaSatya } from "@/components/dashboard/promotion-eligibility"
import { ModalLihatPegawai } from "@/components/pegawai/view-employee-modal"
import type { Pegawai } from "@/lib/types"

export default function KarirPage() {
  const [daftarPegawai, setDaftarPegawai] = useState<Pegawai[]>([])

  const normalisasiStatusKarir = (p: any): string => {
    const statusUtama = (p?.status ?? '').toString().trim()
    if (statusUtama) return statusUtama

    const statusKepegawaian = (p?.kepegawaian?.statusPegawai ?? '').toString().trim()
    const statusLower = statusKepegawaian.toLowerCase()

    if (!statusKepegawaian) return 'Aktif'
    if (['cuti', 'pensiun', 'nonaktif', 'resign'].includes(statusLower)) return statusKepegawaian

    return 'Aktif'
  }

  const [modalLihat, aturModalLihat] = useState<{
    terbuka: boolean
    pegawai: Pegawai | null,
    konteks: 'promosi' | 'satyalancana' | null
  }>({ terbuka: false, pegawai: null, konteks: null })

  useEffect(() => {
    let mounted = true

    fetch('/api/pegawai?per_page=200')
      .then((r) => r.json())
      .then((json) => {
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
          const golongan = pangkatTerbaru
            ? `${pangkatTerbaru.pangkat ?? ''} (${pangkatTerbaru.golongan ?? ''})`.trim()
            : p.golongan

          return {
            ...p,
            identitasResmi: {
              nipIdResmi: identitas.nipIdResmi ?? p.nipPegawai,
              nik: identitas.nik ?? '',
              noBpjs: identitas.noBpjs ?? '',
              noNpwp: identitas.noNpwp ?? '',
              karpeg: identitas.karpeg ?? '',
              karsuKarsi: identitas.karsuKarsi ?? '',
              taspen: identitas.taspen ?? '',
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

        if (mounted) setDaftarPegawai(mapped)
      })
      .catch(() => {
        if (mounted) setDaftarPegawai([])
      })

    return () => {
      mounted = false
    }
  }, [])

  const tanganiLihat = (pegawai: Pegawai, konteks: 'promosi' | 'satyalancana') => {
    aturModalLihat({ terbuka: true, pegawai, konteks })
  }

  return (
    <AdminLayout title="Peningkatan Karir">
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <KelayakanKenaikanPangkat 
          daftarPegawai={daftarPegawai} 
          lihatDetail={tanganiLihat} 
        />
        <SatyalancanaKaryaSatya 
          daftarPegawai={daftarPegawai} 
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
