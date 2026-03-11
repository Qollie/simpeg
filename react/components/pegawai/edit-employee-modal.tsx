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
import { cn } from "@/lib/utils"

const agamaList = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"]
const jenisKelaminList = ["Laki-laki", "Perempuan"]
const statusKepegawaianList = ["PNS", "PPPK", "Non-ASN"]
const jenisPegawaiList = ["Tenaga Struktural", "Tenaga Fungsional", "Tenaga Administrasi"]
const MAX_FOTO_SIZE_BYTES = 5 * 1024 * 1024

type FormErrors = Record<string, string>

const fieldLabels: Record<string, string> = {
  nama: "Nama",
  jabatan: "Jabatan",
  departemen: "Departemen",
  golongan: "Golongan",
  status: "Status",
  tanggalMasuk: "Tanggal masuk",
  tempatLahir: "Tempat lahir",
  tanggalLahir: "Tanggal lahir",
  jenisKelamin: "Jenis kelamin",
  agama: "Agama",
  alamat: "Alamat",
  noHp: "No. HP",
  email: "Email",
  "identitasResmi.nik": "NIK",
  "identitasResmi.noBpjs": "No. BPJS",
  "identitasResmi.noNpwp": "No. NPWP",
  "identitasResmi.karpeg": "Karpeg",
  "identitasResmi.karsuKarsi": "Karsu/Karsi",
  "identitasResmi.taspen": "Taspen",
  "kepegawaian.statusPegawai": "Status pegawai",
  "kepegawaian.jenisPegawai": "Jenis pegawai",
  "kepegawaian.tmtCpns": "TMT CPNS",
  "kepegawaian.tmtPns": "TMT PNS",
  "kepegawaian.masaKerjaTahun": "Masa kerja (tahun)",
  "kepegawaian.masaKerjaBulan": "Masa kerja (bulan)",
}

const maxLengthRules: Record<string, number> = {
  nama: 150,
  jabatan: 150,
  departemen: 150,
  golongan: 100,
  status: 20,
  tempatLahir: 100,
  jenisKelamin: 10,
  agama: 20,
  email: 120,
  noHp: 20,
  "identitasResmi.nik": 16,
  "identitasResmi.noBpjs": 20,
  "identitasResmi.noNpwp": 25,
  "identitasResmi.karpeg": 30,
  "identitasResmi.karsuKarsi": 30,
  "identitasResmi.taspen": 30,
  "kepegawaian.statusPegawai": 20,
  "kepegawaian.jenisPegawai": 50,
}

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
  onSave: (pegawai: Pegawai, fotoFile?: File | null) => Promise<void>
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
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
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
      setFieldErrors({})
    }
  }, [pegawai])

  const getVal = (path: string, source = formData) => {
    const parts = path.split(".")
    return parts.reduce<any>((acc, key) => (acc ? acc[key as keyof typeof acc] : undefined), source)
  }

  const clearFieldError = (path: string) => {
    setFieldErrors((prev) => {
      if (!(path in prev)) return prev
      const next = { ...prev }
      delete next[path]
      return next
    })
  }

  const updateRootField = <K extends keyof Pegawai>(key: K, value: Pegawai[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    clearFieldError(String(key))
  }

  const updateIdentitasField = (key: keyof IdentitasResmi, value: IdentitasResmi[keyof IdentitasResmi]) => {
    setFormData((prev) => ({
      ...prev,
      identitasResmi: ensureIdentitasResmi(pegawai!, { ...prev.identitasResmi, [key]: value }),
    }))
    clearFieldError(`identitasResmi.${String(key)}`)
  }

  const updateKepegawaianField = (key: keyof Kepegawaian, value: Kepegawaian[keyof Kepegawaian]) => {
    setFormData((prev) => ({
      ...prev,
      kepegawaian: ensureKepegawaian(pegawai!, { ...prev.kepegawaian, [key]: value }),
    }))
    clearFieldError(`kepegawaian.${String(key)}`)
  }

  const getFieldError = (path: string) => fieldErrors[path]

  const getInputClassName = (path: string) =>
    cn("bg-secondary text-sm", getFieldError(path) && "border-destructive focus-visible:ring-destructive/20")

  const getSelectClassName = (path: string, baseClassName = "bg-secondary text-sm") =>
    cn(baseClassName, getFieldError(path) && "border-destructive")

  const renderFieldError = (path: string) => {
    const message = getFieldError(path)
    if (!message) return null

    return <p className="text-xs text-destructive">{message}</p>
  }

  const handleSubmit = async (e: FormEvent) => {
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

    const nextErrors: FormErrors = {}

    const missing = requiredFields.filter((key) => {
      if (key.includes(".")) return !`${getVal(key) ?? ""}`.trim()
      const val = (formData as any)[key]
      return !`${val ?? ""}`.trim()
    })

    if (missing.length > 0) {
      missing.forEach((field) => {
        nextErrors[String(field)] = "Kolom ini wajib diisi."
      })
    }

    Object.entries(maxLengthRules).forEach(([path, maxLength]) => {
      const value = `${getVal(path) ?? ""}`.trim()
      if (!value) return
      if (value.length > maxLength) {
        nextErrors[path] = `${fieldLabels[path] ?? path} maksimal ${maxLength} karakter.`
      }
    })

    const email = `${formData.email ?? ""}`.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Format email tidak valid."
    }

    const nik = `${formData.identitasResmi?.nik ?? ""}`.trim()
    if (nik && !/^\d{16}$/.test(nik)) {
      nextErrors["identitasResmi.nik"] = "NIK harus terdiri dari 16 digit."
    }

    const tahun = formData.kepegawaian?.masaKerjaTahun
    if (tahun !== undefined && `${tahun}` !== "") {
      const tahunNum = Number(tahun)
      if (!Number.isInteger(tahunNum) || tahunNum < 0) {
        nextErrors["kepegawaian.masaKerjaTahun"] = "Masa kerja tahun harus bilangan bulat 0 atau lebih."
      }
    }

    const bulan = formData.kepegawaian?.masaKerjaBulan
    if (bulan !== undefined && `${bulan}` !== "") {
      const bulanNum = Number(bulan)
      if (!Number.isInteger(bulanNum) || bulanNum < 0 || bulanNum > 11) {
        nextErrors["kepegawaian.masaKerjaBulan"] = "Masa kerja bulan harus antara 0 sampai 11."
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      toast({
        title: "Validasi Gagal",
        description: "Periksa kembali data yang ditandai pada form.",
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
      const duplicateFieldMap: Record<string, string> = {
        Email: "email",
        NIK: "identitasResmi.nik",
        "No. BPJS": "identitasResmi.noBpjs",
        "No. NPWP": "identitasResmi.noNpwp",
        Karpeg: "identitasResmi.karpeg",
        "Karsu/Karsi": "identitasResmi.karsuKarsi",
        Taspen: "identitasResmi.taspen",
      }
      const duplicateErrors = uniq.reduce<FormErrors>((acc, label) => {
        const key = duplicateFieldMap[label]
        if (key) acc[key] = `${label} sudah digunakan.`
        return acc
      }, {})
      setFieldErrors(duplicateErrors)
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

    setSaving(true)
    setFieldErrors({})
    try {
      await onSave(payload, fotoFile)
      toast({
        title: "Data berhasil disimpan",
        description: `Data pegawai ${formData.nama} telah diperbarui.`,
      })
      onClose()
    } catch (err: any) {
      if (err?.fieldErrors && typeof err.fieldErrors === "object") {
        const mapped = Object.fromEntries(
          Object.entries(err.fieldErrors).map(([key, value]) => {
            const normalizedKey = ["nik", "noBpjs", "noNpwp", "karpeg", "karsuKarsi", "taspen"].includes(key)
              ? `identitasResmi.${key}`
              : ["statusPegawai", "jenisPegawai", "tmtCpns", "tmtPns", "masaKerjaTahun", "masaKerjaBulan"].includes(key)
                ? `kepegawaian.${key}`
                : key
            return [normalizedKey, String(value)]
          })
        )
        setFieldErrors(mapped)
      }
      toast({
        title: "Gagal menyimpan perubahan",
        description: err?.message || "Terjadi kesalahan saat menyimpan data.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  if (file && file.size > MAX_FOTO_SIZE_BYTES) {
                    toast({
                      title: "Foto terlalu besar",
                      description: "Ukuran foto maksimal 5 MB.",
                      variant: "destructive",
                    })
                    e.target.value = ""
                    return
                  }
                  setFotoFile(file)
                }}
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
                onChange={(e) => updateRootField("nipPegawai", e.target.value)}
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
                onChange={(e) => updateRootField("nama", e.target.value)}
                aria-invalid={Boolean(getFieldError("nama"))}
                className={getInputClassName("nama")}
              />
              {renderFieldError("nama")}
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
                onChange={(e) => updateRootField("jabatan", e.target.value)}
                aria-invalid={Boolean(getFieldError("jabatan"))}
                className={getInputClassName("jabatan")}
              />
              {renderFieldError("jabatan")}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="departemen" className="text-xs sm:text-sm">
                Departemen <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.departemen}
                onValueChange={(value) => updateRootField("departemen", value)}
              >
                <SelectTrigger
                  aria-invalid={Boolean(getFieldError("departemen"))}
                  className={getSelectClassName("departemen", "w-full bg-secondary text-sm")}
                >
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
              {renderFieldError("departemen")}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="golongan" className="text-xs sm:text-sm">
                Golongan <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.golongan}
                onValueChange={(value) => updateRootField("golongan", value)}
              >
                <SelectTrigger
                  aria-invalid={Boolean(getFieldError("golongan"))}
                  className={getSelectClassName("golongan", "w-full bg-secondary text-sm")}
                >
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
              {renderFieldError("golongan")}
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
                onChange={(e) => updateRootField("tempatLahir", e.target.value)}
                aria-invalid={Boolean(getFieldError("tempatLahir"))}
                className={getInputClassName("tempatLahir")}
              />
              {renderFieldError("tempatLahir")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalLahir" className="text-sm text-foreground">
                Tanggal Lahir <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tanggalLahir"
                type="date"
                value={formData.tanggalLahir || ""}
                onChange={(e) => updateRootField("tanggalLahir", e.target.value)}
                aria-invalid={Boolean(getFieldError("tanggalLahir"))}
                className={getInputClassName("tanggalLahir")}
              />
              {renderFieldError("tanggalLahir")}
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="jenisKelamin" className="text-sm text-foreground">
                Jenis Kelamin <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.jenisKelamin}
                onValueChange={(value) => updateRootField("jenisKelamin", value)}
              >
                <SelectTrigger
                  aria-invalid={Boolean(getFieldError("jenisKelamin"))}
                  className={getSelectClassName("jenisKelamin")}
                >
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  {jenisKelaminList.map((jk) => (
                    <SelectItem key={jk} value={jk}>{jk}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderFieldError("jenisKelamin")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="agama" className="text-sm text-foreground">Agama <span className="text-destructive">*</span></Label>
              <Select
                value={formData.agama}
                onValueChange={(value) => updateRootField("agama", value)}
              >
                <SelectTrigger
                  aria-invalid={Boolean(getFieldError("agama"))}
                  className={getSelectClassName("agama")}
                >
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  {agamaList.map((ag) => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderFieldError("agama")}
            </div>
          </div>

          {/* Alamat Domisili Section */}
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-2 pt-2">Alamat Domisili</h3>
          <div className="space-y-2">
            <Label htmlFor="alamat" className="text-sm text-foreground">Alamat Lengkap</Label>
            <Input
              id="alamat"
              value={formData.alamat || ""}
              onChange={(e) => updateRootField("alamat", e.target.value)}
              aria-invalid={Boolean(getFieldError("alamat"))}
              className={getInputClassName("alamat")}
            />
            {renderFieldError("alamat")}
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
                onValueChange={(value) => updateRootField("status", value as Pegawai["status"])}
              >
                <SelectTrigger
                  aria-invalid={Boolean(getFieldError("status"))}
                  className={getSelectClassName("status")}
                >
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
              {renderFieldError("status")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalMasuk" className="text-sm text-foreground">
                Tanggal Masuk <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tanggalMasuk"
                type="date"
                value={formData.tanggalMasuk || ""}
                onChange={(e) => updateRootField("tanggalMasuk", e.target.value)}
                aria-invalid={Boolean(getFieldError("tanggalMasuk"))}
                className={getInputClassName("tanggalMasuk")}
              />
              {renderFieldError("tanggalMasuk")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="noHp" className="text-sm text-foreground">
                Nomor HP <span className="text-destructive">*</span>
              </Label>
              <Input
                id="noHp"
                value={formData.noHp || ""}
                onChange={(e) => updateRootField("noHp", e.target.value)}
                aria-invalid={Boolean(getFieldError("noHp"))}
                className={getInputClassName("noHp")}
              />
              {renderFieldError("noHp")}
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
              onChange={(e) => updateRootField("email", e.target.value)}
              aria-invalid={Boolean(getFieldError("email"))}
              className={getInputClassName("email")}
            />
            {renderFieldError("email")}
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
                onChange={(e) => updateIdentitasField("nik", e.target.value)}
                aria-invalid={Boolean(getFieldError("identitasResmi.nik"))}
                className={getInputClassName("identitasResmi.nik")}
              />
              {renderFieldError("identitasResmi.nik")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="noBpjs" className="text-sm text-foreground">
                No. BPJS
              </Label>
              <Input
                id="noBpjs"
                value={formData.identitasResmi?.noBpjs || ""}
                onChange={(e) => updateIdentitasField("noBpjs", e.target.value)}
                aria-invalid={Boolean(getFieldError("identitasResmi.noBpjs"))}
                className={getInputClassName("identitasResmi.noBpjs")}
              />
              {renderFieldError("identitasResmi.noBpjs")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="noNpwp" className="text-sm text-foreground">
                No. NPWP
              </Label>
              <Input
                id="noNpwp"
                value={formData.identitasResmi?.noNpwp || ""}
                onChange={(e) => updateIdentitasField("noNpwp", e.target.value)}
                aria-invalid={Boolean(getFieldError("identitasResmi.noNpwp"))}
                className={getInputClassName("identitasResmi.noNpwp")}
              />
              {renderFieldError("identitasResmi.noNpwp")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="karpeg" className="text-sm text-foreground">
                Karpeg
              </Label>
              <Input
                id="karpeg"
                value={formData.identitasResmi?.karpeg || ""}
                onChange={(e) => updateIdentitasField("karpeg", e.target.value)}
                aria-invalid={Boolean(getFieldError("identitasResmi.karpeg"))}
                className={getInputClassName("identitasResmi.karpeg")}
              />
              {renderFieldError("identitasResmi.karpeg")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="karsuKarsi" className="text-sm text-foreground">
                Karsu/Karsi
              </Label>
              <Input
                id="karsuKarsi"
                value={formData.identitasResmi?.karsuKarsi || ""}
                onChange={(e) => updateIdentitasField("karsuKarsi", e.target.value)}
                aria-invalid={Boolean(getFieldError("identitasResmi.karsuKarsi"))}
                className={getInputClassName("identitasResmi.karsuKarsi")}
              />
              {renderFieldError("identitasResmi.karsuKarsi")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="taspen" className="text-sm text-foreground">
                Taspen
              </Label>
              <Input
                id="taspen"
                value={formData.identitasResmi?.taspen || ""}
                onChange={(e) => updateIdentitasField("taspen", e.target.value)}
                aria-invalid={Boolean(getFieldError("identitasResmi.taspen"))}
                className={getInputClassName("identitasResmi.taspen")}
              />
              {renderFieldError("identitasResmi.taspen")}
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
                onValueChange={(value) => updateKepegawaianField("statusPegawai", value)}
              >
                <SelectTrigger
                  aria-invalid={Boolean(getFieldError("kepegawaian.statusPegawai"))}
                  className={getSelectClassName("kepegawaian.statusPegawai")}
                >
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
              {renderFieldError("kepegawaian.statusPegawai")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenisPegawai" className="text-sm text-foreground">
                Jenis Pegawai <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.kepegawaian?.jenisPegawai}
                onValueChange={(value) => updateKepegawaianField("jenisPegawai", value)}
              >
                <SelectTrigger
                  aria-invalid={Boolean(getFieldError("kepegawaian.jenisPegawai"))}
                  className={getSelectClassName("kepegawaian.jenisPegawai")}
                >
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
              {renderFieldError("kepegawaian.jenisPegawai")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tmtCpns" className="text-sm text-foreground">
                TMT CPNS <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tmtCpns"
                type="date"
                value={formData.kepegawaian?.tmtCpns || ""}
                onChange={(e) => updateKepegawaianField("tmtCpns", e.target.value)}
                aria-invalid={Boolean(getFieldError("kepegawaian.tmtCpns"))}
                className={getInputClassName("kepegawaian.tmtCpns")}
              />
              {renderFieldError("kepegawaian.tmtCpns")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tmtPns" className="text-sm text-foreground">
                TMT PNS
              </Label>
              <Input
                id="tmtPns"
                type="date"
                value={formData.kepegawaian?.tmtPns || ""}
                onChange={(e) => updateKepegawaianField("tmtPns", e.target.value)}
                aria-invalid={Boolean(getFieldError("kepegawaian.tmtPns"))}
                className={getInputClassName("kepegawaian.tmtPns")}
              />
              {renderFieldError("kepegawaian.tmtPns")}
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
                onChange={(e) => updateKepegawaianField("masaKerjaTahun", e.target.value === "" ? 0 : Number(e.target.value))}
                aria-invalid={Boolean(getFieldError("kepegawaian.masaKerjaTahun"))}
                className={getInputClassName("kepegawaian.masaKerjaTahun")}
              />
              {renderFieldError("kepegawaian.masaKerjaTahun")}
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
                onChange={(e) => updateKepegawaianField("masaKerjaBulan", e.target.value === "" ? 0 : Number(e.target.value))}
                aria-invalid={Boolean(getFieldError("kepegawaian.masaKerjaBulan"))}
                className={getInputClassName("kepegawaian.masaKerjaBulan")}
              />
              {renderFieldError("kepegawaian.masaKerjaBulan")}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 flex-col-reverse sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="text-sm" disabled={saving}>
              Batal
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground text-sm" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
