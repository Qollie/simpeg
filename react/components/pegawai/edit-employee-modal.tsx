"use client"

import type { FormEvent } from "react"
import { useState, useEffect } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Pegawai } from "@/lib/types"
import { departemenList, statusList, golonganList } from "@/lib/mock-data"

const agamaList = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"]
const jenisKelaminList = ["Laki-laki", "Perempuan"]

interface EditEmployeeModalProps {
  pegawai: Pegawai | null
  isOpen: boolean
  onClose: () => void
  onSave: (pegawai: Pegawai) => void
}

export function EditEmployeeModal({
  pegawai,
  isOpen,
  onClose,
  onSave,
}: EditEmployeeModalProps) {
  const [formData, setFormData] = useState<Partial<Pegawai>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (pegawai) {
      setFormData(pegawai)
    }
  }, [pegawai])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (formData && pegawai) {
      onSave({ ...pegawai, ...formData } as Pegawai)
      toast({
        title: "Data berhasil disimpan",
        description: `Data pegawai ${formData.nama} telah diperbarui.`,
      })
    }
    onClose()
  }

  if (!pegawai) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border-border bg-card p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Edit Data Pegawai
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identitas Section */}
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Identitas Pegawai</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nipPegawai" className="text-sm text-foreground">
                NIP
              </Label>
              <Input
                id="nipPegawai"
                value={formData.nipPegawai || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nipPegawai: e.target.value })
                }
                className="bg-secondary text-sm"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama" className="text-sm text-foreground">
                Nama Lengkap
              </Label>
              <Input
                id="nama"
                value={formData.nama || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                className="bg-secondary text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jabatan" className="text-sm text-foreground">
                Jabatan
              </Label>
              <Input
                id="jabatan"
                value={formData.jabatan || ""}
                onChange={(e) =>
                  setFormData({ ...formData, jabatan: e.target.value })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departemen" className="text-sm text-foreground">
                Departemen
              </Label>
              <Select
                value={formData.departemen}
                onValueChange={(value) =>
                  setFormData({ ...formData, departemen: value })
                }
              >
                <SelectTrigger className="bg-secondary text-sm">
                  <SelectValue placeholder="Pilih Departemen" />
                </SelectTrigger>
                <SelectContent>
                  {departemenList.slice(1).map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="golongan" className="text-sm text-foreground">
              Golongan
            </Label>
            <Select
              value={formData.golongan}
              onValueChange={(value) =>
                setFormData({ ...formData, golongan: value })
              }
            >
              <SelectTrigger className="bg-secondary text-sm">
                <SelectValue placeholder="Pilih Golongan" />
              </SelectTrigger>
              <SelectContent>
                {golonganList.map((gol) => (
                  <SelectItem key={gol} value={gol}>{gol}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Data Pribadi Section */}
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-2 pt-2">Data Pribadi</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tempatLahir" className="text-sm text-foreground">
                Tempat Lahir
              </Label>
              <Input
                id="tempatLahir"
                value={(formData as any).tempatLahir || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tempatLahir: e.target.value } as any)
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalLahir" className="text-sm text-foreground">
                Tanggal Lahir
              </Label>
              <Input
                id="tanggalLahir"
                type="date"
                value={(formData as any).tanggalLahir || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalLahir: e.target.value } as any)
                }
                className="bg-secondary text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="jenisKelamin" className="text-sm text-foreground">
                Jenis Kelamin
              </Label>
              <Select
                value={(formData as any).jenisKelamin}
                onValueChange={(value) =>
                  setFormData({ ...formData, jenisKelamin: value } as any)
                }
              >
                <SelectTrigger className="bg-secondary text-sm">
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  {jenisKelaminList.map((jk) => (
                    <SelectItem key={jk} value={jk}>{jk}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agama" className="text-sm text-foreground">Agama</Label>
              <Select
                value={(formData as any).agama}
                onValueChange={(value) =>
                  setFormData({ ...formData, agama: value } as any)
                }
              >
                <SelectTrigger className="bg-secondary text-sm">
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  {agamaList.map((ag) => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alamat Domisili Section */}
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-2 pt-2">Alamat Domisili</h3>
          <div className="space-y-2">
            <Label htmlFor="alamat" className="text-sm text-foreground">Alamat Lengkap</Label>
            <Input
              id="alamat"
              value={(formData as any).alamat || ""}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value } as any)}
              className="bg-secondary text-sm"
            />
          </div>

          {/* Status & Kontak Section */}
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-2 pt-2">Status & Kontak</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm text-foreground">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as Pegawai["status"],
                  })
                }
              >
                <SelectTrigger className="bg-secondary text-sm">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusList.slice(1).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noHp" className="text-sm text-foreground">
                Nomor HP
              </Label>
              <Input
                id="noHp"
                value={formData.noHp || ""}
                onChange={(e) =>
                  setFormData({ ...formData, noHp: e.target.value })
                }
                className="bg-secondary text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="bg-secondary text-sm"
            />
          </div>

          <DialogFooter className="gap-2 pt-4 flex-col-reverse sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="text-sm">
              Batal
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground text-sm">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
