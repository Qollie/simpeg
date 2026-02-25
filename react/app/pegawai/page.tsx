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

export default function PegawaiPage() {
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
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

      fetch('/api/pegawai?' + params.toString())
        .then((r) => r.json())
        .then((json) => {
          const items = json.data ?? json
          const mapped: Pegawai[] = (items || []).map((p: any) => ({
            nipPegawai: p.nipPegawai,
            nama: p.nama,
            gelarDepan: p.gelarDepan ?? undefined,
            gelarBelakang: p.gelarBelakang ?? undefined,
            jabatan: p.jabatan ?? undefined,
            departemen: p.departemen ?? undefined,
            golongan: p.golongan ?? undefined,
            status: p.status ?? 'Aktif',
            tanggalMasuk: p.tanggalMasuk ?? undefined,
            email: p.email ?? undefined,
            noHp: p.noHp ?? '',
            foto: p.foto ?? undefined,
            tempatLahir: p.tempatLahir ?? '',
            tanggalLahir: p.tanggalLahir ?? '',
            jenisKelamin: p.jenisKelamin ?? '',
            agama: p.agama ?? undefined,
            alamat: p.alamat ?? undefined,
            identitasResmi: p.identitasResmi ? {
              nik: p.identitasResmi.nik ?? undefined,
              noBpjs: p.identitasResmi.noBpjs ?? undefined,
              noNpwp: p.identitasResmi.noNpwp ?? undefined,
            } : undefined,
            efiles: p.efiles ?? [],
            kepegawaian: p.kepegawaian,
            riwayatPangkat: p.riwayatPangkat,
          }))

          if (mounted) {
            setPegawaiList(mapped)
            setLastPage(json.last_page ?? 1)
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
  }, [page, perPage, searchQuery, departemen, status])

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

  const handleSaveEdit = (updatedPegawai: Pegawai) => {
    setPegawaiList((prev) =>
      prev.map((p) => (p.nipPegawai === updatedPegawai.nipPegawai ? updatedPegawai : p))
    )
  }

  const handleEditDocument = (pegawaiId: string, dokumenId: string, namaFile: string) => {
    // Placeholder - to be implemented
  }

  const handleDeleteDocument = (pegawaiId: string, dokumenId: string) => {
    // Placeholder - to be implemented
  }

  const handleAddEmployee = (newPegawai: Pegawai, dokumen: Dokumen[]) => {
    setPegawaiList((prev) => [...prev, newPegawai])
    setAddModal(false)
  }

  const handleAddDocument = (pegawaiId: string, newDocs: any[]) => {
    // Placeholder - to be implemented
  }

    const handleDeleteClick = (pegawaiId: string, pegawaiNama: string) => {
      setDeleteDialog({ isOpen: true, pegawaiId, pegawaiNama })
    }

    const handleConfirmDelete = () => {
      if (deleteDialog.pegawaiId) {
        setPegawaiList((prev) =>
          prev.filter((p) => p.nipPegawai !== deleteDialog.pegawaiId)
        )
        toast({
          title: "Pegawai dihapus",
          description: `${deleteDialog.pegawaiNama} telah dihapus dari daftar pegawai.`,
          variant: "destructive",
        })
        setDeleteDialog({ isOpen: false, pegawaiId: null, pegawaiNama: "" })
      }
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
