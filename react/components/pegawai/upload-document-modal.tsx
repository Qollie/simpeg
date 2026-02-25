import type { ChangeEvent } from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  File,
  FileImage,
  X,
  CheckCircle2,
  AlertCircle,
  Upload,
  Plus,
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Pegawai, Dokumen } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EditDocumentModalProps {
  pegawai: Pegawai | null
  isOpen: boolean
  onClose: () => void
  onEdit: (pegawaiId: string, dokumenId: string, namaFile: string) => void
  onAdd: (pegawaiId: string, newDocs: Dokumen[]) => void
}

type EditStatus = "idle" | "editing" | "success" | "error"

export function EditDocumentModal({
  pegawai,
  isOpen,
  onClose,
  onEdit,
  onAdd,
}: EditDocumentModalProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "add">("edit")
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<EditStatus>("idle")
  const [namaFile, setNamaFile] = useState("")
  const [newFiles, setNewFiles] = useState<File[]>([])
  const { toast } = useToast()

  const handleSelectDocument = (dokumenId: string, dokumenNama: string) => {
    setSelectedDocId(dokumenId)
    setNamaFile(dokumenNama.split(".")[0])
  }

  const handleEdit = async () => {
    if (!selectedDocId || !pegawai || !namaFile) return

    setEditStatus("editing")

    // Simulate edit
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onEdit(pegawai.nipPegawai, selectedDocId, namaFile)
    setEditStatus("success")
    toast({
      title: "Dokumen berhasil diubah",
      description: `Nama dokumen telah diperbarui untuk ${pegawai.nama}.`,
    })

    setTimeout(() => {
      setSelectedDocId(null)
      setNamaFile("")
      setEditStatus("idle")
      onClose()
    }, 1000)
  }

  const handleFileAdd = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles((prev) => [...prev, ...Array.from(e.target.files || [])])
    }
  }

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!pegawai || newFiles.length === 0) return

    setEditStatus("editing")

    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newDocs: Dokumen[] = newFiles.map((file) => ({
      id: Date.now().toString() + Math.random(),
      nama: file.name,
      tipe: file.type.split("/")[1]?.toUpperCase() || "FILE",
      ukuran: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      tanggalUpload: new Date().toISOString().split("T")[0],
    }))

    onAdd(pegawai.nipPegawai, newDocs)
    setNewFiles([])
    setEditStatus("success")

    setTimeout(() => {
      setEditStatus("idle")
    }, 1500)
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
      return FileImage
    }
    return File
  }

  if (!pegawai) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        if (editStatus !== "editing") {
          setSelectedDocId(null)
          setNamaFile("")
          setEditStatus("idle")
          setNewFiles([])
          setActiveTab("edit")
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-border bg-card p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Edit Dokumen
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Untuk: <span className="font-medium">{pegawai.nama}</span>
          </p>
        </DialogHeader>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-border mb-2">
          <button
            onClick={() => setActiveTab("edit")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "edit" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Daftar Dokumen
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "add" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Tambah Dokumen
          </button>
        </div>

        <div className="space-y-4">
          {/* TAB: EDIT DOKUMEN */}
          {activeTab === "edit" && (
            <>
            <div className="space-y-2">
            <Label className="text-sm text-foreground">Pilih Dokumen untuk Diubah</Label>
            {!pegawai.efiles || pegawai.efiles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Belum ada dokumen yang tersimpan
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pegawai.efiles.map((doc: any) => {
                  const isSelected = selectedDocId === doc.id
                  const FileIcon =
                    ["jpg", "jpeg", "png", "gif"].includes(
                      doc.tipe.toLowerCase()
                    ) ? FileImage : File
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDocument(doc.id, doc.nama)}
                      className={cn(
                        "cursor-pointer rounded-lg border p-3 transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-secondary/30 hover:bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "rounded-lg p-2 flex-shrink-0",
                          isSelected ? "bg-primary/20" : "bg-primary/10"
                        )}>
                          <FileIcon className={cn(
                            "h-5 w-5",
                            isSelected ? "text-primary" : "text-primary"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {doc.nama}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span className="hidden sm:inline">{doc.tipe}</span>
                            <span className="hidden sm:inline">{doc.ukuran}</span>
                            <span className="truncate">{doc.tanggalUpload}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
            
            {/* File Name Input */}
            {selectedDocId && (
              <div className="space-y-2">
              <Label htmlFor="namaFile" className="text-sm text-foreground">
                Nama Dokumen Baru
              </Label>
              <Input
                id="namaFile"
                value={namaFile}
                onChange={(e) => setNamaFile(e.target.value)}
                placeholder="Masukkan nama dokumen baru"
                className="bg-secondary text-sm"
              />
            </div>
            )}
            </>
          )}

          {/* TAB: TAMBAH DOKUMEN */}
          {activeTab === "add" && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-border bg-secondary/30 p-6">
                <input
                  type="file"
                  multiple
                  onChange={handleFileAdd}
                  className="hidden"
                  id="addDocInput"
                />
                <label htmlFor="addDocInput" className="cursor-pointer block">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-primary/50" />
                    <div className="text-center text-sm">
                      <p className="font-medium text-foreground">
                        Klik untuk memilih file
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG (Max. 5 MB)
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {newFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">File yang akan diupload:</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {newFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border border-border bg-card p-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Plus className="h-4 w-4" />
                          </div>
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveNewFile(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Status */}
          {editStatus === "success" && (
            <div className="flex items-center gap-2 rounded-lg bg-accent/10 p-3 text-accent">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                {activeTab === "edit" ? "Dokumen berhasil diubah!" : "Dokumen berhasil ditambahkan!"}
              </span>
            </div>
          )}

          {editStatus === "error" && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                Gagal mengubah dokumen
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 flex-col-reverse sm:flex-row">
          <Button
            type="button"
            variant="destructive"
            onClick={onClose}
            disabled={editStatus === "editing"}
            className="text-sm"
          >
            Batal
          </Button>
          
          {activeTab === "edit" ? (
          <Button
            onClick={handleEdit}
            disabled={
              !selectedDocId ||
              !namaFile ||
              editStatus === "editing" ||
              editStatus === "success"
            }
            className="bg-primary text-primary-foreground text-sm"
          >
            {editStatus === "editing" ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Mengubah...
              </>
            ) : (
              "Ubah Dokumen"
            )}
          </Button>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={newFiles.length === 0 || editStatus === "editing" || editStatus === "success"}
              className="bg-primary text-primary-foreground text-sm"
            >
              {editStatus === "editing" ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Mengupload...
                </>
              ) : (
                `Upload ${newFiles.length > 0 ? `(${newFiles.length})` : ""}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
