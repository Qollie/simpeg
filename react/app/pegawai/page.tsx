import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useState, useMemo, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { EmployeeList } from "@/components/pegawai/employee-list"
import { SearchFilter } from "@/components/pegawai/search-filter"
import { EditEmployeeModal } from "@/components/pegawai/edit-employee-modal"
import { EditDocumentModal } from "@/components/pegawai/upload-document-modal"
import { ModalLihatPegawai } from "@/components/pegawai/view-employee-modal"
import { AddEmployeeModal } from "@/components/pegawai/add-employee-modal"
import { Button } from "@/components/ui/button"
import { UserPlus, Users } from "lucide-react"
import type { Pegawai, Dokumen } from "@/lib/types"
import { apiFetch } from "@/lib/api"

const apiBase = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ?? ""

type PegawaiApi = any

const normalizePegawaiFromApi = (p: PegawaiApi, reloadKey = 0): Pegawai => {
  const identitas = p.identitasResmi ?? p.identitas_resmi ?? {}
  const kepegawaianRaw = p.kepegawaian ?? {}
  const riwayatPangkatRaw = p.riwayatPangkat ?? p.riwayat_pangkat ?? []

  const statusPegawai = kepegawaianRaw.statusPegawai ?? ""
  const jenisPegawai = kepegawaianRaw.jenisPegawai ?? p.departemen ?? ""

  const kepegawaian = {
    ...kepegawaianRaw,
    statusPegawai,
    jenisPegawai,
    tmtCpns: kepegawaianRaw.tmtCpns ?? p.tmtCpns ?? p.tanggalMasuk ?? "",
    tmtPns: kepegawaianRaw.tmtPns ?? p.tmtPns ?? "",
    masaKerjaTahun: kepegawaianRaw.masaKerjaTahun ?? p.masaKerjaTahun ?? 0,
    masaKerjaBulan: kepegawaianRaw.masaKerjaBulan ?? p.masaKerjaBulan ?? 0,
  }
  if (!kepegawaian.statusPegawai) {
    kepegawaian.statusPegawai = ""
  }
  if (!kepegawaian.jenisPegawai) {
    kepegawaian.jenisPegawai = p.departemen ?? ""
  }

  const riwayatTerbaru = [...riwayatPangkatRaw]
    .sort((a: any, b: any) => {
      const da = new Date(a?.tmtPangkat ?? 0).getTime()
      const db = new Date(b?.tmtPangkat ?? 0).getTime()
      return db - da
    })[0]

  const pangkatTerbaru = riwayatTerbaru?.pangkat
  const golongan = pangkatTerbaru
    ? `${pangkatTerbaru.pangkat ?? ""} (${pangkatTerbaru.golongan ?? ""})`.trim()
    : (p.golongan ?? undefined)

  return {
    nipPegawai: p.nipPegawai,
    nama: p.nama,
    gelarDepan: p.gelarDepan ?? undefined,
    gelarBelakang: p.gelarBelakang ?? undefined,
    jabatan: p.jabatan ?? undefined,
    departemen: p.departemen ?? jenisPegawai ?? "",
    golongan,
    status: p.status ?? statusPegawai ?? "Aktif",
    tanggalMasuk: p.tanggalMasuk ?? kepegawaian.tmtCpns ?? kepegawaian.tmtPns ?? undefined,
    email: p.email ?? undefined,
    noHp: p.noHp ?? "",
    foto: p.foto
      ? `${p.foto}${String(p.foto).includes("?") ? "&" : "?"}v=${reloadKey}`
      : undefined,
    tempatLahir: p.tempatLahir ?? "",
    tanggalLahir: p.tanggalLahir ?? "",
    jenisKelamin: p.jenisKelamin ?? "",
    agama: p.agama ?? undefined,
    alamat: p.alamat ?? undefined,
    identitasResmi: Object.keys(identitas).length
      ? {
          nipIdResmi: identitas.nipIdResmi ?? p.nipPegawai,
          nik: identitas.nik ?? "",
          noBpjs: identitas.noBpjs ?? "",
          noNpwp: identitas.noNpwp ?? "",
          karpeg: identitas.karpeg ?? "",
          karsuKarsi: identitas.karsuKarsi ?? "",
          taspen: identitas.taspen ?? "",
        }
      : {
          nipIdResmi: p.nipPegawai,
          nik: "",
          noBpjs: "",
          noNpwp: "",
          karpeg: "",
          karsuKarsi: "",
          taspen: "",
        },
    efiles: p.efiles ?? [],
    kepegawaian,
    riwayatPangkat: riwayatPangkatRaw.map((r: any) => ({
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

export default function PegawaiPage() {
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [departemenOptions, setDepartemenOptions] = useState<string[]>(["Semua"])
  const [statusOptions, setStatusOptions] = useState<string[]>(["Semua"])
  const [pangkatOptions, setPangkatOptions] = useState<string[]>([])
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [lastPage, setLastPage] = useState(1)
  const [loadingData, setLoadingData] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [departemen, setDepartemen] = useState("Semua")
  const [status, setStatus] = useState("Semua")

  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    pegawai: Pegawai | null
  }>({ isOpen: false, pegawai: null })

  const [editDocModal, setEditDocModal] = useState<{
    isOpen: boolean
    pegawai: Pegawai | null
  }>({ isOpen: false, pegawai: null })

  const [modalLihat, aturModalLihat] = useState<{
    terbuka: boolean
    pegawai: Pegawai | null
  }>({ terbuka: false, pegawai: null })

  const [addModal, setAddModal] = useState(false)

  // fetch data from API with debounced search and pagination
  useEffect(() => {
    let mounted = true
    let t: any = null

      const doFetch = () => {
      setLoadingData(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(perPage))
        if (departemen && departemen !== 'Semua') params.set('departemen', departemen)
        if (status && status !== 'Semua') params.set('status', status)
      if (searchQuery) params.set('q', searchQuery)

      apiFetch(`${apiBase}/api/pegawai?` + params.toString(), { credentials: 'include' })
        .then((r) => r.json())
        .then((json) => {
          const items = json.data ?? json
          const mapped: Pegawai[] = (items || []).map((p: any) => normalizePegawaiFromApi(p, reloadKey))

          const departemenFromApi: string[] = json?.filter_options?.departemen ?? []
          const statusFromApi: string[] = json?.filter_options?.status ?? []
          const pangkatFromApi: string[] = json?.filter_options?.pangkat ?? []

          if (mounted) {
            setPegawaiList(mapped)
            setLastPage(json.last_page ?? 1)
            setDepartemenOptions(['Semua', ...departemenFromApi])
            setStatusOptions(['Semua', ...statusFromApi])
            setPangkatOptions(pangkatFromApi)
          }
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setLoadingData(false)
        })
    }

    // debounce search: quick immediate fetch for page changes, debounce for search
    if (searchQuery) {
      t = setTimeout(doFetch, 350)
    } else {
      doFetch()
    }

    return () => {
      mounted = false
      if (t) clearTimeout(t)
    }
  }, [page, perPage, searchQuery, departemen, status, reloadKey])

    const [deleteDialog, setDeleteDialog] = useState<{
      isOpen: boolean
      pegawaiId: string | null
      pegawaiNama: string
    }>({ isOpen: false, pegawaiId: null, pegawaiNama: "" })

    const { toast } = useToast()
  const filteredPegawai = useMemo(() => {
    // Server-side filtering already applied; just return list
    return pegawaiList
  }, [pegawaiList, searchQuery, departemen, status])

  const handleEdit = (pegawai: Pegawai) => {
    setEditModal({ isOpen: true, pegawai })
  }

  const handleEditDoc = (pegawai: Pegawai) => {
    setEditDocModal({ isOpen: true, pegawai })
  }

  const handleView = (pegawai: Pegawai) => {
    aturModalLihat({ terbuka: true, pegawai })
  }

  const handleSaveEdit = async (updatedPegawai: Pegawai, fotoFile?: File | null) => {
    const formData = new FormData()

    const putField = (key: string, value: unknown) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    }

    putField('nama', updatedPegawai.nama)
    putField('gelarDepan', updatedPegawai.gelarDepan)
    putField('gelarBelakang', updatedPegawai.gelarBelakang)
    putField('tempatLahir', updatedPegawai.tempatLahir)
    putField('tanggalLahir', updatedPegawai.tanggalLahir)
    putField('jenisKelamin', updatedPegawai.jenisKelamin)
    putField('agama', updatedPegawai.agama)
    putField('alamat', updatedPegawai.alamat)
    putField('email', updatedPegawai.email)
    putField('noHp', updatedPegawai.noHp)
    putField('jabatan', updatedPegawai.jabatan)
    putField('golongan', updatedPegawai.golongan)
    putField('status', updatedPegawai.status)
    putField('departemen', updatedPegawai.departemen)
    putField('tanggalMasuk', updatedPegawai.tanggalMasuk)

    // Identitas Resmi
    putField('nik', updatedPegawai.identitasResmi?.nik)
    putField('noBpjs', updatedPegawai.identitasResmi?.noBpjs)
    putField('noNpwp', updatedPegawai.identitasResmi?.noNpwp)
    putField('karpeg', updatedPegawai.identitasResmi?.karpeg)
    putField('karsuKarsi', updatedPegawai.identitasResmi?.karsuKarsi)
    putField('taspen', updatedPegawai.identitasResmi?.taspen)

    // Kepegawaian
    putField('statusPegawai', updatedPegawai.kepegawaian?.statusPegawai)
    putField('jenisPegawai', updatedPegawai.kepegawaian?.jenisPegawai || updatedPegawai.departemen)
    putField('tmtCpns', updatedPegawai.kepegawaian?.tmtCpns)
    putField('tmtPns', updatedPegawai.kepegawaian?.tmtPns)
    putField('masaKerjaTahun', updatedPegawai.kepegawaian?.masaKerjaTahun)
    putField('masaKerjaBulan', updatedPegawai.kepegawaian?.masaKerjaBulan)

    if (fotoFile) {
      formData.append('foto', fotoFile)
    }

    formData.append('_method', 'PUT')

    const response = await apiFetch(`${apiBase}/api/pegawai/${updatedPegawai.nipPegawai}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Gagal menyimpan perubahan pegawai')
    }

    setReloadKey((v) => v + 1)
  }

  const handleEditDocument = async (pegawaiId: string, dokumenId: string, namaFile: string) => {
    const response = await apiFetch(`${apiBase}/api/documents/${dokumenId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ namaFile }),
    })

    if (!response.ok) {
      throw new Error('Gagal mengubah dokumen')
    }

    setReloadKey((v) => v + 1)
  }

  const handleDeleteDocument = async (pegawaiId: string, dokumenId: string) => {
    const response = await apiFetch(`${apiBase}/api/documents/${dokumenId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      toast({
        title: 'Gagal menghapus dokumen',
        description: 'Terjadi kesalahan saat menghapus dokumen.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Dokumen dihapus',
      description: 'Dokumen berhasil dihapus dari pegawai.',
    })

    setReloadKey((v) => v + 1)
  }

  const handleAddEmployee = async (newPegawai: Pegawai, _dokumen: Dokumen[], fotoFile?: File | null) => {
    const formData = new FormData()

    const put = (key: string, val: any) => {
      if (val === undefined || val === null) return
      formData.append(key, String(val))
    }

    put('nipPegawai', newPegawai.nipPegawai)
    put('nama', newPegawai.nama)
    put('gelarDepan', newPegawai.gelarDepan)
    put('gelarBelakang', newPegawai.gelarBelakang)
    put('tempatLahir', newPegawai.tempatLahir)
    put('tanggalLahir', newPegawai.tanggalLahir)
    put('jenisKelamin', newPegawai.jenisKelamin)
    put('agama', newPegawai.agama)
    put('alamat', newPegawai.alamat)
    put('email', newPegawai.email)
    put('noHp', newPegawai.noHp)
    put('jabatan', newPegawai.jabatan)
    put('golongan', newPegawai.golongan)
    put('status', newPegawai.status)
    put('departemen', newPegawai.departemen)
    put('tanggalMasuk', newPegawai.tanggalMasuk)
    // identitas resmi
    put('nik', newPegawai.identitasResmi?.nik)
    put('noBpjs', newPegawai.identitasResmi?.noBpjs)
    put('noNpwp', newPegawai.identitasResmi?.noNpwp)
    put('karpeg', newPegawai.identitasResmi?.karpeg)
    put('karsuKarsi', newPegawai.identitasResmi?.karsuKarsi)
    put('taspen', newPegawai.identitasResmi?.taspen)
    // kepegawaian
    put('statusPegawai', newPegawai.kepegawaian?.statusPegawai)
    put('jenisPegawai', newPegawai.kepegawaian?.jenisPegawai)
    put('tmtCpns', newPegawai.kepegawaian?.tmtCpns)
    put('tmtPns', newPegawai.kepegawaian?.tmtPns)
    put('masaKerjaTahun', newPegawai.kepegawaian?.masaKerjaTahun ?? 0)
    put('masaKerjaBulan', newPegawai.kepegawaian?.masaKerjaBulan ?? 0)

    if (fotoFile) {
      formData.append('foto', fotoFile)
    }

    const res = await apiFetch(`${apiBase}/api/pegawai`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (!res.ok) {
      let msg = 'Periksa data dan coba lagi.'
      try {
        const txt = await res.text()
        try {
          const err = JSON.parse(txt)
          msg = err?.message || JSON.stringify(err)
        } catch {
          msg = txt || msg
        }
      } catch {}
      console.error('POST /api/pegawai failed', res.status, res.statusText, msg)
      throw new Error(msg)
    }

    setReloadKey((v) => v + 1)
    setAddModal(false)
    toast({
      title: 'Berhasil',
      description: `${newPegawai.nama} berhasil ditambahkan.`,
    })
  }

  const handleAddDocument = async (pegawaiId: string, newFiles: File[]) => {
    for (const file of newFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('jenisDokumen', (file.type?.split('/')[1] || 'FILE').toUpperCase())
      formData.append('namaFile', file.name)

      const response = await apiFetch(`${apiBase}/api/pegawai/${pegawaiId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Gagal upload dokumen')
      }
    }

    setReloadKey((v) => v + 1)
  }

    const handleDeleteClick = (pegawaiId: string, pegawaiNama: string) => {
      setDeleteDialog({ isOpen: true, pegawaiId, pegawaiNama })
    }

    const handleConfirmDelete = async () => {
      if (!deleteDialog.pegawaiId) return

      const res = await apiFetch(`${apiBase}/api/pegawai/${deleteDialog.pegawaiId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        let msg = "Terjadi kesalahan saat menghapus pegawai."
        try {
          const err = await res.json()
          msg = err?.message || JSON.stringify(err)
        } catch {}
        toast({
          title: "Gagal menghapus",
          description: msg,
          variant: "destructive",
        })
        return
      }

      // Optimistic update + refetch
      setPegawaiList((prev) =>
        prev.filter((p) => p.nipPegawai !== deleteDialog.pegawaiId)
      )
      setReloadKey((v) => v + 1)

      toast({
        title: "Pegawai dihapus",
        description: `${deleteDialog.pegawaiNama} telah dihapus dari daftar pegawai.`,
        variant: "destructive",
      })
      setDeleteDialog({ isOpen: false, pegawaiId: null, pegawaiNama: "" })
    }
  const resetFilters = () => {
    setSearchQuery("")
    setDepartemen("Semua")
    setStatus("Semua")
  }

  return (
    <AdminLayout title="Data Pegawai">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 md:h-12 md:w-12">
              <Users className="h-5 w-5 text-primary-foreground md:h-6 md:w-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground md:text-lg">
                Manajemen Pegawai Kaltim
              </h2>
              <p className="text-xs text-muted-foreground md:text-sm">
                {filteredPegawai.length} dari {pegawaiList.length} data pegawai terdaftar
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setAddModal(true)}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Tambah Pegawai</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          departemen={departemen}
          onDepartemenChange={setDepartemen}
          status={status}
          onStatusChange={setStatus}
          departemenOptions={departemenOptions}
          statusOptions={statusOptions}
          onReset={resetFilters}
        />

        {/* Employee List */}
        <EmployeeList
          data={filteredPegawai}
          onEdit={handleEdit}
          onUpload={handleEditDoc}
          onView={handleView}
            onDelete={handleDeleteClick}
        />

        {/* Pagination controls */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {loadingData ? 'Memuat...' : `Halaman ${page} dari ${lastPage}`}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Sebelumnya
            </Button>
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
            >
              Berikutnya
            </Button>
          </div>
        </div>

        {/* Modals */}
        <EditEmployeeModal
          pegawai={editModal.pegawai}
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, pegawai: null })}
          onSave={handleSaveEdit}
          existingPegawai={pegawaiList}
        />

        <EditDocumentModal
          pegawai={editDocModal.pegawai}
          isOpen={editDocModal.isOpen}
          onClose={() => setEditDocModal({ isOpen: false, pegawai: null })}
          onEdit={handleEditDocument}
          onAdd={handleAddDocument}
        />

        <ModalLihatPegawai
          pegawai={modalLihat.pegawai}
          terbuka={modalLihat.terbuka}
          tutup={() => aturModalLihat({ terbuka: false, pegawai: null })}
          hapusDokumen={handleDeleteDocument}
        />

        <AddEmployeeModal
          isOpen={addModal}
          onClose={() => setAddModal(false)}
          onAdd={handleAddEmployee}
          existingPegawai={pegawaiList}
          golonganOptions={pangkatOptions}
        />

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => {
            if (!open) {
              setDeleteDialog({ isOpen: false, pegawaiId: null, pegawaiNama: "" })
            }
          }}>
            <AlertDialogContent className="border-border bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  Hapus Pegawai
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Apakah Anda yakin ingin menghapus pegawai <span className="font-semibold">{deleteDialog.pegawaiNama}</span> dari sistem? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-center gap-3">
                <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80">
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Hapus
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
      </div>
    </AdminLayout>
  )
}
