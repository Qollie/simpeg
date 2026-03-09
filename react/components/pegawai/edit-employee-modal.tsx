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
import type { IdentitasResmi, Kepegawaian, Pegawai } from "@/lib/types"
import { departemenList, statusList, golonganList } from "@/lib/mock-data"

const agamaList = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"]
const jenisKelaminList = ["Laki-laki", "Perempuan"]
const statusKepegawaianList = ["PNS", "PPPK", "Non-ASN"]
const jenisPegawaiList = ["Tenaga Struktural", "Tenaga Fungsional", "Tenaga Administrasi"]

const ensureIdentitasResmi = (pegawai: Pegawai, current?: Partial<IdentitasResmi>): IdentitasResmi => ({
  nipIdResmi: current?.nipIdResmi ?? pegawai.identitasResmi?.nipIdResmi ?? pegawai.nipPegawai,
  nik: current?.nik ?? "",
  noBpjs: current?.noBpjs ?? "",
  noNpwp: current?.noNpwp ?? "",
  karpeg: current?.karpeg ?? "",
  karsuKarsi: current?.karsuKarsi ?? "",
  taspen: current?.taspen ?? "",
})

const ensureKepegawaian = (pegawai: Pegawai, current?: Partial<Kepegawaian>): Kepegawaian => ({
  nipKepegawaian: current?.nipKepegawaian ?? pegawai.kepegawaian?.nipKepegawaian ?? pegawai.nipPegawai,
  statusPegawai: current?.statusPegawai ?? pegawai.kepegawaian?.statusPegawai ?? pegawai.status ?? "",
  jenisPegawai: current?.jenisPegawai ?? pegawai.kepegawaian?.jenisPegawai ?? pegawai.departemen ?? "",
  tmtCpns: current?.tmtCpns ?? pegawai.kepegawaian?.tmtCpns ?? pegawai.tanggalMasuk ?? "",
  tmtPns: current?.tmtPns ?? pegawai.kepegawaian?.tmtPns ?? "",
  masaKerjaTahun: current?.masaKerjaTahun ?? pegawai.kepegawaian?.masaKerjaTahun ?? 0,
  masaKerjaBulan: current?.masaKerjaBulan ?? pegawai.kepegawaian?.masaKerjaBulan ?? 0,
})

interface EditEmployeeModalProps {
  pegawai: Pegawai | null
  isOpen: boolean
  onClose: () => void
  onSave: (pegawai: Pegawai, fotoFile?: File | null) => void
  existingPegawai?: Pegawai[]
}

export function EditEmployeeModal({
  pegawai,
  isOpen,
  onClose,
  onSave,
  existingPegawai = [],
}: EditEmployeeModalProps) {
  const [formData, setFormData] = useState<Partial<Pegawai>>({})
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (pegawai) {
      setFormData({
        ...pegawai,
        status: pegawai.status ?? pegawai.kepegawaian?.statusPegawai ?? "",
        departemen: pegawai.departemen ?? pegawai.kepegawaian?.jenisPegawai ?? "",
        identitasResmi: ensureIdentitasResmi(pegawai, pegawai.identitasResmi),
        kepegawaian: ensureKepegawaian(pegawai, pegawai.kepegawaian),
      })
      setFotoFile(null)
    }
  }, [pegawai])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!pegawai) return

    const requiredFields: (keyof Pegawai | string)[] = [
      "nama",
      "jabatan",
      "departemen",
      "golongan",
      "status",
      "tanggalMasuk",
      "tempatLahir",
      "tanggalLahir",
      "jenisKelamin",
      "agama",
      "noHp",
      "email",
      "identitasResmi.nik",
      "kepegawaian.statusPegawai",
      "kepegawaian.jenisPegawai",
      "kepegawaian.tmtCpns",
    ]

    const getVal = (path: string) => {
      const parts = path.split(".")
      return parts.reduce<any>((acc, key) => (acc ? acc[key as keyof typeof acc] : undefined), formData)
    }

    const missing = requiredFields.filter((key) => {
      if (key.includes(".")) return !`${getVal(key) ?? ""}`.trim()
      const val = (formData as any)[key]
      return !`${val ?? ""}`.trim()
    })

    if (missing.length > 0) {
      toast({
        title: "Validasi Gagal",
        description: "Harap isi semua field bertanda *.",
        variant: "destructive",
      })
      return
    }

    // Uniqueness validation (exclude current pegawai)
    const duplicates: string[] = []
    const normalizedEmail = formData.email?.trim().toLowerCase()

    existingPegawai
      .filter((p) => p.nipPegawai !== pegawai.nipPegawai)
      .forEach((p) => {
        const ident = p.identitasResmi
        if (normalizedEmail && p.email && p.email.toLowerCase() === normalizedEmail) duplicates.push("Email")
        if (ident) {
          if (formData.identitasResmi?.nik && ident.nik === formData.identitasResmi.nik) duplicates.push("NIK")
          if (formData.identitasResmi?.noBpjs && ident.noBpjs === formData.identitasResmi.noBpjs) duplicates.push("No. BPJS")
          if (formData.identitasResmi?.noNpwp && ident.noNpwp === formData.identitasResmi.noNpwp) duplicates.push("No. NPWP")
          if (formData.identitasResmi?.karpeg && ident.karpeg === formData.identitasResmi.karpeg) duplicates.push("Karpeg")
          if (formData.identitasResmi?.karsuKarsi && ident.karsuKarsi === formData.identitasResmi.karsuKarsi) duplicates.push("Karsu/Karsi")
          if (formData.identitasResmi?.taspen && ident.taspen === formData.identitasResmi.taspen) duplicates.push("Taspen")
        }
      })

    if (duplicates.length > 0) {
      const uniq = Array.from(new Set(duplicates))
      toast({
        title: "Kode sudah digunakan",
        description: `Kolom ${uniq.join(", ")} tidak boleh sama dengan pegawai lain.`,
        variant: "destructive",
      })
      return
    }

    const mergedIdentitas = {
      ...ensureIdentitasResmi(pegawai, pegawai.identitasResmi),
      ...formData.identitasResmi,
    }

    const mergedKepegawaian = {
      ...ensureKepegawaian(pegawai, pegawai.kepegawaian),
      ...formData.kepegawaian,
    }

    if (mergedKepegawaian.masaKerjaTahun !== undefined) {
      mergedKepegawaian.masaKerjaTahun = Number(mergedKepegawaian.masaKerjaTahun)
    }
    if (mergedKepegawaian.masaKerjaBulan !== undefined) {
      mergedKepegawaian.masaKerjaBulan = Number(mergedKepegawaian.masaKerjaBulan)
    }

    const payload: Pegawai = {
      ...pegawai,
      ...formData,
      identitasResmi: mergedIdentitas,
      kepegawaian: mergedKepegawaian,
    } as Pegawai

    onSave(payload, fotoFile)
    toast({
      title: "Data berhasil disimpan",
      description: `Data pegawai ${formData.nama} telah diperbarui.`,
    })
    onClose()
  }

  if (!pegawai) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[92vw] max-w-3xl sm:max-w-4xl overflow-y-auto border-border bg-card p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Edit Data Pegawai
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto Profil */}
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
              {fotoFile ? (
                <img
                  src={URL.createObjectURL(fotoFile)}
                  alt="Preview Foto"
                  className="h-full w-full object-cover"
                />
              ) : pegawai?.foto ? (
                <img src={pegawai.foto} alt={pegawai.nama} className="h-full w-full object-cover" />
              ) : (
                pegawai?.nama?.slice(0, 2)?.toUpperCase() || "PF"
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="foto" className="text-sm text-foreground">
                Foto Profil
              </Label>
              <Input
                id="foto"
                type="file"
                accept="image/*"
                onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
                className="bg-secondary text-sm"
              />
              <p className="text-xs text-muted-foreground">Format gambar, maks 5MB.</p>
            </div>
          </div>
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
                Nama Lengkap <span className="text-destructive">*</span>
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

          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-start">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="jabatan" className="text-xs sm:text-sm">
                Jabatan <span className="text-destructive">*</span>
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
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="departemen" className="text-xs sm:text-sm">
                Departemen <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.departemen}
                onValueChange={(value) =>
                  setFormData({ ...formData, departemen: value })
                }
              >
                <SelectTrigger className="w-full bg-secondary text-sm">
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {departemenList
                    .filter((d) => d !== "Semua")
                    .map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="golongan" className="text-xs sm:text-sm">
                Golongan <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.golongan}
                onValueChange={(value) =>
                  setFormData({ ...formData, golongan: value })
                }
              >
                <SelectTrigger className="w-full bg-secondary text-sm">
                  <SelectValue placeholder="Pilih golongan" />
                </SelectTrigger>
                <SelectContent>
                  {golonganList.map((gol) => (
                    <SelectItem key={gol} value={gol}>
                      {gol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Pribadi Section */}
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-2 pt-2">Data Pribadi</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tempatLahir" className="text-sm text-foreground">
                Tempat Lahir <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tempatLahir"
                value={formData.tempatLahir || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tempatLahir: e.target.value })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalLahir" className="text-sm text-foreground">
                Tanggal Lahir <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tanggalLahir"
                type="date"
                value={formData.tanggalLahir || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalLahir: e.target.value })
                }
                className="bg-secondary text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="jenisKelamin" className="text-sm text-foreground">
                Jenis Kelamin <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.jenisKelamin}
                onValueChange={(value) =>
                  setFormData({ ...formData, jenisKelamin: value })
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
              <Label htmlFor="agama" className="text-sm text-foreground">Agama <span className="text-destructive">*</span></Label>
              <Select
                value={formData.agama}
                onValueChange={(value) =>
                  setFormData({ ...formData, agama: value })
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
              value={formData.alamat || ""}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="bg-secondary text-sm"
            />
          </div>

          {/* Status & Kontak Section */}
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-2 pt-2">Status & Kontak</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm text-foreground">
                Status <span className="text-destructive">*</span>
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
              <Label htmlFor="tanggalMasuk" className="text-sm text-foreground">
                Tanggal Masuk <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tanggalMasuk"
                type="date"
                value={formData.tanggalMasuk || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalMasuk: e.target.value })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noHp" className="text-sm text-foreground">
                Nomor HP <span className="text-destructive">*</span>
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
              Email <span className="text-destructive">*</span>
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

          {/* Identitas Resmi */}
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-2 pt-2">Identitas Resmi</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nik" className="text-sm text-foreground">
                NIK <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nik"
                value={formData.identitasResmi?.nik || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identitasResmi: ensureIdentitasResmi(pegawai, { ...formData.identitasResmi, nik: e.target.value }),
                  })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noBpjs" className="text-sm text-foreground">
                No. BPJS
              </Label>
              <Input
                id="noBpjs"
                value={formData.identitasResmi?.noBpjs || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identitasResmi: ensureIdentitasResmi(pegawai, { ...formData.identitasResmi, noBpjs: e.target.value }),
                  })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noNpwp" className="text-sm text-foreground">
                No. NPWP
              </Label>
              <Input
                id="noNpwp"
                value={formData.identitasResmi?.noNpwp || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identitasResmi: ensureIdentitasResmi(pegawai, { ...formData.identitasResmi, noNpwp: e.target.value }),
                  })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="karpeg" className="text-sm text-foreground">
                Karpeg
              </Label>
              <Input
                id="karpeg"
                value={formData.identitasResmi?.karpeg || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identitasResmi: ensureIdentitasResmi(pegawai, { ...formData.identitasResmi, karpeg: e.target.value }),
                  })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="karsuKarsi" className="text-sm text-foreground">
                Karsu/Karsi
              </Label>
              <Input
                id="karsuKarsi"
                value={formData.identitasResmi?.karsuKarsi || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identitasResmi: ensureIdentitasResmi(pegawai, { ...formData.identitasResmi, karsuKarsi: e.target.value }),
                  })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taspen" className="text-sm text-foreground">
                Taspen
              </Label>
              <Input
                id="taspen"
                value={formData.identitasResmi?.taspen || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identitasResmi: ensureIdentitasResmi(pegawai, { ...formData.identitasResmi, taspen: e.target.value }),
                  })
                }
                className="bg-secondary text-sm"
              />
            </div>
          </div>

          {/* Data Kepegawaian */}
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-2 pt-2">Data Kepegawaian</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="statusPegawai" className="text-sm text-foreground">
                Status Pegawai <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.kepegawaian?.statusPegawai}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    kepegawaian: ensureKepegawaian(pegawai, { ...formData.kepegawaian, statusPegawai: value }),
                  })
                }
              >
                <SelectTrigger className="bg-secondary text-sm">
                  <SelectValue placeholder="Pilih Status Pegawai" />
                </SelectTrigger>
                <SelectContent>
                  {statusKepegawaianList.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenisPegawai" className="text-sm text-foreground">
                Jenis Pegawai <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.kepegawaian?.jenisPegawai}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    kepegawaian: ensureKepegawaian(pegawai, { ...formData.kepegawaian, jenisPegawai: value }),
                  })
                }
              >
                <SelectTrigger className="bg-secondary text-sm">
                  <SelectValue placeholder="Pilih Jenis Pegawai" />
                </SelectTrigger>
                <SelectContent>
                  {jenisPegawaiList.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tmtCpns" className="text-sm text-foreground">
                TMT CPNS <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tmtCpns"
                type="date"
                value={formData.kepegawaian?.tmtCpns || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kepegawaian: ensureKepegawaian(pegawai, { ...formData.kepegawaian, tmtCpns: e.target.value }),
                  })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tmtPns" className="text-sm text-foreground">
                TMT PNS
              </Label>
              <Input
                id="tmtPns"
                type="date"
                value={formData.kepegawaian?.tmtPns || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kepegawaian: ensureKepegawaian(pegawai, { ...formData.kepegawaian, tmtPns: e.target.value }),
                  })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="masaKerjaTahun" className="text-sm text-foreground">
                Masa Kerja (Tahun)
              </Label>
              <Input
                id="masaKerjaTahun"
                type="number"
                min="0"
                value={formData.kepegawaian?.masaKerjaTahun ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kepegawaian: ensureKepegawaian(pegawai, {
                      ...formData.kepegawaian,
                      masaKerjaTahun: e.target.value === "" ? 0 : Number(e.target.value),
                    }),
                  })
                }
                className="bg-secondary text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="masaKerjaBulan" className="text-sm text-foreground">
                Masa Kerja (Bulan)
              </Label>
              <Input
                id="masaKerjaBulan"
                type="number"
                min="0"
                value={formData.kepegawaian?.masaKerjaBulan ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kepegawaian: ensureKepegawaian(pegawai, {
                      ...formData.kepegawaian,
                      masaKerjaBulan: e.target.value === "" ? 0 : Number(e.target.value),
                    }),
                  })
                }
                className="bg-secondary text-sm"
              />
            </div>
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
