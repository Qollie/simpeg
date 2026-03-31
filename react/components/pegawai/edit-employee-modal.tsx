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
import {
  agamaList,
  calculateMasaKerja,
  jenisKelaminList,
  jenisPegawaiList,
  MAX_FOTO_SIZE_BYTES,
  maximumBirthDateString,
  statusKepegawaianList,
  todayString,
} from "@/lib/pegawai-form-shared"
import {
  applyBirthDateValidation,
  applyDateNotAfterTodayValidation,
  applyEmailValidation,
  applyMasaKerjaValidation,
  applyMaxLengthValidation,
  applyNikValidation,
  buildDuplicateErrors,
  editPegawaiFieldLabels,
  editPegawaiMaxLengthRules,
  findPegawaiDuplicates,
  normalizePegawaiFieldErrors,
} from "@/lib/pegawai-form-validation"
import { buildEditPegawaiPayload } from "@/lib/pegawai-form-payload"
import { ensureIdentitasResmi, ensureKepegawaian, normalizePegawaiToEditForm } from "@/lib/pegawai-form-state"
import type { IdentitasResmi, Kepegawaian, Pegawai } from "@/lib/types"
import { departemenList, statusList, golonganList } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type FormErrors = Record<string, string>

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
  const calculatedMasaKerja = calculateMasaKerja(formData.kepegawaian?.tmtCpns)

  useEffect(() => {
    if (pegawai) {
      setFormData(normalizePegawaiToEditForm(pegawai))
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
      kepegawaian:
        key === "tmtCpns"
          ? ensureKepegawaian(pegawai!, {
              ...prev.kepegawaian,
              tmtCpns: value as string,
              masaKerjaTahun: calculateMasaKerja((value as string) || "").tahun,
              masaKerjaBulan: calculateMasaKerja((value as string) || "").bulan,
            })
          : ensureKepegawaian(pegawai!, { ...prev.kepegawaian, [key]: value }),
    }))
    clearFieldError(`kepegawaian.${String(key)}`)
    if (key === "tmtCpns") {
      clearFieldError("kepegawaian.masaKerjaTahun")
      clearFieldError("kepegawaian.masaKerjaBulan")
    }
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
      "kepegawaian.tmtPns",
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

    applyMaxLengthValidation(nextErrors, (path) => `${getVal(path) ?? ""}`, editPegawaiMaxLengthRules, editPegawaiFieldLabels)
    applyEmailValidation(nextErrors, "email", `${formData.email ?? ""}`.trim())
    applyNikValidation(nextErrors, "identitasResmi.nik", `${formData.identitasResmi?.nik ?? ""}`.trim())
    applyDateNotAfterTodayValidation(nextErrors, "tanggalMasuk", "Tanggal masuk", `${formData.tanggalMasuk ?? ""}`.trim())
    applyDateNotAfterTodayValidation(nextErrors, "kepegawaian.tmtCpns", "TMT CPNS", `${formData.kepegawaian?.tmtCpns ?? ""}`.trim())
    applyDateNotAfterTodayValidation(nextErrors, "kepegawaian.tmtPns", "TMT PNS", `${formData.kepegawaian?.tmtPns ?? ""}`.trim())
    applyBirthDateValidation(nextErrors, "tanggalLahir", `${formData.tanggalLahir ?? ""}`.trim())
    applyMasaKerjaValidation(
      nextErrors,
      "kepegawaian.masaKerjaTahun",
      "kepegawaian.masaKerjaBulan",
      calculatedMasaKerja.tahun,
      calculatedMasaKerja.bulan
    )

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
    const duplicates = findPegawaiDuplicates(
      existingPegawai,
      {
        email: formData.email,
        nik: formData.identitasResmi?.nik,
        noBpjs: formData.identitasResmi?.noBpjs,
        noNpwp: formData.identitasResmi?.noNpwp,
        karpeg: formData.identitasResmi?.karpeg,
        karsuKarsi: formData.identitasResmi?.karsuKarsi,
        taspen: formData.identitasResmi?.taspen,
      },
      { excludeNipPegawai: pegawai.nipPegawai }
    )

    if (duplicates.length > 0) {
      const duplicateErrors = buildDuplicateErrors(duplicates, {
        nik: "identitasResmi",
        noBpjs: "identitasResmi",
        noNpwp: "identitasResmi",
        karpeg: "identitasResmi",
        karsuKarsi: "identitasResmi",
        taspen: "identitasResmi",
      }) as FormErrors
      setFieldErrors(duplicateErrors)
      toast({
        title: "Kode sudah digunakan",
        description: `Kolom ${duplicates.join(", ")} tidak boleh sama dengan pegawai lain.`,
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
      masaKerjaTahun: calculatedMasaKerja.tahun,
      masaKerjaBulan: calculatedMasaKerja.bulan,
    }

    if (mergedKepegawaian.masaKerjaTahun !== undefined) {
      mergedKepegawaian.masaKerjaTahun = Number(mergedKepegawaian.masaKerjaTahun)
    }
    if (mergedKepegawaian.masaKerjaBulan !== undefined) {
      mergedKepegawaian.masaKerjaBulan = Number(mergedKepegawaian.masaKerjaBulan)
    }

    const payload: Pegawai = buildEditPegawaiPayload({
      pegawai,
      formData,
      identitasResmi: mergedIdentitas,
      kepegawaian: mergedKepegawaian,
    })

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
        setFieldErrors(normalizePegawaiFieldErrors(err.fieldErrors, "nested"))
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
                max={maximumBirthDateString}
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
                max={todayString}
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
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
                TMT CPNS
              </Label>
              <Input
                id="tmtCpns"
                type="date"
                max={todayString}
                value={formData.kepegawaian?.tmtCpns || ""}
                onChange={(e) => updateKepegawaianField("tmtCpns", e.target.value)}
                aria-invalid={Boolean(getFieldError("kepegawaian.tmtCpns"))}
                className={getInputClassName("kepegawaian.tmtCpns")}
              />
              {renderFieldError("kepegawaian.tmtCpns")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tmtPns" className="text-sm text-foreground">
                TMT PNS <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tmtPns"
                type="date"
                max={todayString}
                value={formData.kepegawaian?.tmtPns || ""}
                onChange={(e) => updateKepegawaianField("tmtPns", e.target.value)}
                aria-invalid={Boolean(getFieldError("kepegawaian.tmtPns"))}
                className={getInputClassName("kepegawaian.tmtPns")}
              />
              {renderFieldError("kepegawaian.tmtPns")}
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
