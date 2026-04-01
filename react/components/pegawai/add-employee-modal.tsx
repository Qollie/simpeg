import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Upload, X, Camera, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  agamaOptions,
  calculateMasaKerja,
  departemenOptions,
  golonganOptions as golonganStaticOptions,
  jenisPegawaiOptions,
  jenisKelaminOptions,
  MAX_FOTO_SIZE_BYTES,
  maximumBirthDateString,
  statusInternalOptions,
  statusKepegawaianLabelFromValue,
  statusKepegawaianOptions,
  todayString,
} from "@/lib/pegawai-form-shared"
import {
  addPegawaiFieldLabels,
  addPegawaiMaxLengthRules,
  applyAgeAtJoinValidation,
  applyBirthDateValidation,
  applyDateNotAfterTodayValidation,
  applyEmailValidation,
  applyMasaKerjaValidation,
  applyMaxLengthValidation,
  applyNikValidation,
  buildDuplicateErrors,
  findPegawaiDuplicates,
  normalizePegawaiFieldErrors,
} from "@/lib/pegawai-form-validation"
import { buildAddPegawaiPayload, buildDokumenObjects, buildEfilesFromDokumen } from "@/lib/pegawai-form-payload"
import { createInitialAddPegawaiForm, type AddPegawaiFormState } from "@/lib/pegawai-form-state"
import type { Pegawai, Dokumen, EfilePegawai } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AddEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (pegawai: Pegawai, dokumen: Dokumen[], fotoFile?: File | null) => Promise<void>
  existingPegawai?: Pegawai[]
  golonganOptions?: string[]
}

type FormErrors = Partial<Record<keyof AddPegawaiFormState, string>>

export function AddEmployeeModal({
  isOpen,
  onClose,
  onAdd,
  existingPegawai = [],
  golonganOptions = [],
}: AddEmployeeModalProps) {
  const [formData, setFormData] = useState<AddPegawaiFormState>(createInitialAddPegawaiForm)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  const [dokumen, setDokumen] = useState<File[]>([])
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const selectedStatusPegawai = statusKepegawaianLabelFromValue(formData.statusPegawai)
  const masaKerjaSourceDate = selectedStatusPegawai === "PPPK" ? formData.tmtPppk : formData.tmtPns
  const calculatedMasaKerja = calculateMasaKerja(masaKerjaSourceDate)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name === "tmtPns" || name === "tmtPppk") {
        const masaKerja = calculateMasaKerja(value)
        return {
          ...prev,
          [name]: value,
          masaKerjaTahun: String(masaKerja.tahun),
          masaKerjaBulan: String(masaKerja.bulan),
        }
      }

      return { ...prev, [name]: value }
    })
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[name as keyof FormErrors]
      if (name === "tmtPns" || name === "tmtPppk") {
        delete next.masaKerjaTahun
        delete next.masaKerjaBulan
      }
      return next
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      if (name === "statusPegawai") {
        const status = statusKepegawaianLabelFromValue(value)

        if (status === "PNS") {
          return { ...prev, statusPegawai: value, tmtPppk: "" }
        }

        if (status === "PPPK") {
          return { ...prev, statusPegawai: value, tmtCpns: "", tmtPns: "" }
        }

        if (status === "Non-ASN") {
          return { ...prev, statusPegawai: value, tmtCpns: "", tmtPns: "", tmtPppk: "" }
        }
      }

      return { ...prev, [name]: value }
    })
    setFieldErrors((prev) => {
      if (!(name in prev)) return prev
      const next = { ...prev }
      delete next[name as keyof FormErrors]
      return next
    })
  }

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDokumen((prev) => [...prev, ...Array.from(e.target.files || [])])
    }
  }

  const handleRemoveFile = (index: number) => {
    setDokumen((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > MAX_FOTO_SIZE_BYTES) {
        toast({
          title: "Foto terlalu besar",
          description: "Ukuran foto maksimal 5 MB.",
          variant: "destructive",
        })
        e.target.value = ""
        return
      }
      setFotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    const requiredFields: (keyof AddPegawaiFormState)[] = [
      "nipPegawai",
      "nama",
      "jabatan",
      "tempatLahir",
      "tanggalLahir",
      "jenisKelamin",
      "noHp",
      "email",
      "nik",
      "departemen",
      "golongan",
      "status",
      "statusPegawai",
      "jenisPegawai",
      "tanggalMasuk",
      "agama",
      "masaKerjaTahun",
      "masaKerjaBulan",
    ]

    if (selectedStatusPegawai === "PNS") {
      requiredFields.push("tmtPns")
    }

    if (selectedStatusPegawai === "PPPK") {
      requiredFields.push("tmtPppk")
    }

    const nextErrors: FormErrors = {}

    requiredFields.forEach((field) => {
      const value =
        field === "masaKerjaTahun"
          ? String(calculatedMasaKerja.tahun)
          : field === "masaKerjaBulan"
            ? String(calculatedMasaKerja.bulan)
            : `${formData[field]}`

      if (!`${value}`.trim()) {
        nextErrors[field] = "Kolom ini wajib diisi."
      }
    })

    applyMaxLengthValidation(nextErrors, (path) => `${formData[path as keyof AddPegawaiFormState] ?? ""}`, addPegawaiMaxLengthRules, addPegawaiFieldLabels)

    if (formData.nipPegawai.trim() && !/^\d{18}$/.test(formData.nipPegawai.trim())) {
      nextErrors.nipPegawai = "NIP harus terdiri dari 18 digit."
    }

    applyEmailValidation(nextErrors, "email", formData.email.trim())
    applyNikValidation(nextErrors, "nik", formData.nik.trim())

    applyDateNotAfterTodayValidation(nextErrors, "tanggalMasuk", "Tanggal masuk", formData.tanggalMasuk.trim())
    applyDateNotAfterTodayValidation(nextErrors, "tmtCpns", "TMT CPNS", formData.tmtCpns.trim())
    applyDateNotAfterTodayValidation(nextErrors, "tmtPns", "TMT PNS", formData.tmtPns.trim())
    applyDateNotAfterTodayValidation(nextErrors, "tmtPppk", "TMT PPPK", formData.tmtPppk.trim())
    applyBirthDateValidation(nextErrors, "tanggalLahir", formData.tanggalLahir.trim())
    applyAgeAtJoinValidation(nextErrors, formData.tanggalLahir.trim(), formData.tanggalMasuk.trim())
    applyMasaKerjaValidation(nextErrors, "masaKerjaTahun", "masaKerjaBulan", calculatedMasaKerja.tahun, calculatedMasaKerja.bulan)

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      toast({
        title: "Validasi Gagal",
        description: "Periksa kembali data yang ditandai pada form.",
        variant: "destructive",
      })
      return
    }

    // Uniqueness validation against existing data
    const duplicates = findPegawaiDuplicates(
      existingPegawai,
      {
        nipPegawai: formData.nipPegawai,
        email: formData.email,
        nik: formData.nik,
        noBpjs: formData.noBpjs,
        noNpwp: formData.noNpwp,
        karpeg: formData.karpeg,
        karsuKarsi: formData.karsuKarsi,
        taspen: formData.taspen,
      },
      { includeNip: true }
    )

    if (duplicates.length > 0) {
      const nextErrors = buildDuplicateErrors(duplicates) as FormErrors
      setFieldErrors(nextErrors)
      toast({
        title: "Kode sudah digunakan",
        description: `Kolom ${duplicates.join(", ")} tidak boleh sama dengan pegawai lain.`,
        variant: "destructive",
      })
      return
    }

    const dokumenObjects: Dokumen[] = buildDokumenObjects(dokumen)
    const efiles: EfilePegawai[] = buildEfilesFromDokumen(dokumenObjects, formData.nipPegawai)

    const newPegawai: Pegawai = buildAddPegawaiPayload({
      formData,
      fotoPreview,
      efiles,
      masaKerja: {
        tahun: Number(calculatedMasaKerja.tahun),
        bulan: Number(calculatedMasaKerja.bulan),
      },
    })

    setSubmitting(true)
    setFieldErrors({})
    try {
      await onAdd(newPegawai, dokumenObjects, fotoFile)
      resetForm()
    } catch (err: any) {
      if (err?.fieldErrors && typeof err.fieldErrors === "object") {
        setFieldErrors(normalizePegawaiFieldErrors(err.fieldErrors, "flat") as FormErrors)
      }
      toast({
        title: "Gagal menambah pegawai",
        description: err?.message || "Terjadi kesalahan saat menyimpan data. Periksa data dan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData(createInitialAddPegawaiForm())
    setFieldErrors({})
    setDokumen([])
    setFotoFile(null)
    setFotoPreview(null)
    onClose()
  }

  const getFieldError = (field: keyof AddPegawaiFormState) => fieldErrors[field]

  const getInputClassName = (field: keyof AddPegawaiFormState) =>
    cn("bg-secondary text-sm", getFieldError(field) && "border-destructive focus-visible:ring-destructive/20")

  const getSelectClassName = (field: keyof AddPegawaiFormState, baseClassName = "bg-secondary text-sm") =>
    cn(baseClassName, getFieldError(field) && "border-destructive")

  const renderFieldError = (field: keyof AddPegawaiFormState) => {
    const message = getFieldError(field)
    if (!message) return null

    return <p className="text-xs text-destructive">{message}</p>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="top-[5%] translate-y-0 max-h-[95vh] w-[90vw] max-w-[90vw] sm:max-w-[90vw] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Tambah Pegawai Baru</DialogTitle>
          <DialogDescription className="text-sm">
            Isi semua informasi pegawai dan unggah dokumen pendukung
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Foto Profil Section */}
          <div className="flex flex-col items-center justify-center gap-4 py-4 border-b border-border">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-dashed border-border bg-secondary/30 hover:bg-secondary/50 transition-colors group">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <Camera className="h-8 w-8 mb-1" />
                  <span className="text-[10px] font-medium">Upload Foto</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 cursor-pointer opacity-0" 
                onChange={handleFotoChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">Klik lingkaran di atas untuk menambahkan foto pegawai</p>
          </div>

          {/* Identitas Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Identitas Pegawai</h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nipPegawai" className="text-sm">
                  NIP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nipPegawai"
                  name="nipPegawai"
                  placeholder="Nomor Induk Pegawai"
                  value={formData.nipPegawai}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("nipPegawai"))}
                  className={getInputClassName("nipPegawai")}
                />
                {renderFieldError("nipPegawai")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-sm">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nama"
                  name="nama"
                  placeholder="Nama lengkap"
                  value={formData.nama}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("nama"))}
                  className={getInputClassName("nama")}
                />
                {renderFieldError("nama")}
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gelarDepan" className="text-sm">
                  Gelar Depan
                </Label>
                <Input
                  id="gelarDepan"
                  name="gelarDepan"
                  placeholder="Dr."
                  value={formData.gelarDepan}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("gelarDepan"))}
                  className={getInputClassName("gelarDepan")}
                />
                {renderFieldError("gelarDepan")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gelarBelakang" className="text-sm">
                  Gelar Belakang
                </Label>
                <Input
                  id="gelarBelakang"
                  name="gelarBelakang"
                  placeholder="S.Kom"
                  value={formData.gelarBelakang}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("gelarBelakang"))}
                  className={getInputClassName("gelarBelakang")}
                />
                {renderFieldError("gelarBelakang")}
              </div>
            </div>

            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-start">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="jabatan" className="text-xs sm:text-sm">
                  Jabatan <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="jabatan"
                  name="jabatan"
                  placeholder="Posisi/Jabatan"
                  value={formData.jabatan}
                  onChange={handleInputChange}
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
                  onValueChange={(value) =>
                    handleSelectChange("departemen", value)
                  }
                >
                  <SelectTrigger
                    aria-invalid={Boolean(getFieldError("departemen"))}
                    className={getSelectClassName("departemen", "w-full bg-secondary text-sm")}
                  >
                    <SelectValue placeholder="Pilih departemen" />
                  </SelectTrigger>
                  <SelectContent>
                    {departemenOptions.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
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
                  onValueChange={(value) =>
                    handleSelectChange("golongan", value)
                  }
                >
                  <SelectTrigger
                    aria-invalid={Boolean(getFieldError("golongan"))}
                    className={getSelectClassName("golongan", "w-full bg-secondary text-sm")}
                  >
                    <SelectValue placeholder="Pilih golongan" />
                  </SelectTrigger>
                  <SelectContent>
                    {golonganStaticOptions.map((gol) => (
                      <SelectItem key={gol.value} value={gol.value}>
                        {gol.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError("golongan")}
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm">
                  Status Pegawai Internal <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(getFieldError("status"))}
                    className={getSelectClassName("status")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusInternalOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError("status")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggalMasuk" className="text-sm">
                  Tanggal Masuk <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tanggalMasuk"
                  name="tanggalMasuk"
                  type="date"
                  max={todayString}
                  value={formData.tanggalMasuk}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("tanggalMasuk"))}
                  className={getInputClassName("tanggalMasuk")}
                />
                {renderFieldError("tanggalMasuk")}
              </div>
            </div>
          </div>

          {/* Data Pribadi Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Data Pribadi</h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tempatLahir" className="text-sm">
                  Tempat Lahir <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tempatLahir"
                  name="tempatLahir"
                  placeholder="Kota kelahiran"
                  value={formData.tempatLahir}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("tempatLahir"))}
                  className={getInputClassName("tempatLahir")}
                />
                {renderFieldError("tempatLahir")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggalLahir" className="text-sm">
                  Tanggal Lahir <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tanggalLahir"
                  name="tanggalLahir"
                  type="date"
                  max={maximumBirthDateString}
                  value={formData.tanggalLahir}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("tanggalLahir"))}
                  className={getInputClassName("tanggalLahir")}
                />
                {renderFieldError("tanggalLahir")}
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="jenisKelamin" className="text-sm">
                  Jenis Kelamin <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.jenisKelamin}
                  onValueChange={(value) => handleSelectChange("jenisKelamin", value)}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(getFieldError("jenisKelamin"))}
                    className={getSelectClassName("jenisKelamin")}
                  >
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisKelaminOptions.map((jk) => (
                      <SelectItem key={jk.value} value={jk.value}>{jk.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError("jenisKelamin")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="agama" className="text-sm">Agama <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.agama}
                  onValueChange={(value) => handleSelectChange("agama", value)}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(getFieldError("agama"))}
                    className={getSelectClassName("agama")}
                  >
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    {agamaOptions.map((ag) => (
                      <SelectItem key={ag.value} value={ag.value}>{ag.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError("agama")}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat" className="text-sm">Alamat Lengkap</Label>
              <Input
                id="alamat"
                name="alamat"
                placeholder="Jl. Contoh No. 123, RT 01 RW 02"
                value={formData.alamat}
                onChange={handleInputChange}
                aria-invalid={Boolean(getFieldError("alamat"))}
                className={getInputClassName("alamat")}
              />
              {renderFieldError("alamat")}
            </div>
          </div>

          {/* Kontak Section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Informasi Kontak</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("email"))}
                  className={getInputClassName("email")}
                />
                {renderFieldError("email")}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="noHp" className="text-xs sm:text-sm">
                  No. HP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="noHp"
                  name="noHp"
                  placeholder="081234567890"
                  value={formData.noHp}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("noHp"))}
                  className={getInputClassName("noHp")}
                />
                {renderFieldError("noHp")}
              </div>
            </div>
          </div>

          {/* Identitas Resmi (Database) */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Identitas Resmi</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nik" className="text-sm">
                  NIK <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nik"
                  name="nik"
                  placeholder="Nomor Induk Kependudukan"
                  value={formData.nik}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("nik"))}
                  className={getInputClassName("nik")}
                />
                {renderFieldError("nik")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="noBpjs" className="text-sm">
                  No. BPJS
                </Label>
                <Input
                  id="noBpjs"
                  name="noBpjs"
                  placeholder="Nomor BPJS"
                  value={formData.noBpjs}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("noBpjs"))}
                  className={getInputClassName("noBpjs")}
                />
                {renderFieldError("noBpjs")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="noNpwp" className="text-sm">
                  No. NPWP
                </Label>
                <Input
                  id="noNpwp"
                  name="noNpwp"
                  placeholder="Nomor NPWP"
                  value={formData.noNpwp}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("noNpwp"))}
                  className={getInputClassName("noNpwp")}
                />
                {renderFieldError("noNpwp")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="karpeg" className="text-sm">
                  Karpeg
                </Label>
                <Input
                  id="karpeg"
                  name="karpeg"
                  placeholder="Nomor Karpeg"
                  value={formData.karpeg}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("karpeg"))}
                  className={getInputClassName("karpeg")}
                />
                {renderFieldError("karpeg")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="karsuKarsi" className="text-sm">
                  Karsu/Karsi
                </Label>
                <Input
                  id="karsuKarsi"
                  name="karsuKarsi"
                  placeholder="Nomor Karsu/Karsi"
                  value={formData.karsuKarsi}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("karsuKarsi"))}
                  className={getInputClassName("karsuKarsi")}
                />
                {renderFieldError("karsuKarsi")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="taspen" className="text-sm">
                  Taspen
                </Label>
                <Input
                  id="taspen"
                  name="taspen"
                  placeholder="Nomor Taspen"
                  value={formData.taspen}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(getFieldError("taspen"))}
                  className={getInputClassName("taspen")}
                />
                {renderFieldError("taspen")}
              </div>
            </div>
          </div>

          {/* Kepegawaian Section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Data Kepegawaian</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="statusPegawai" className="text-sm">
                  Status Pegawai <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.statusPegawai}
                  onValueChange={(value) => handleSelectChange("statusPegawai", value)}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(getFieldError("statusPegawai"))}
                    className={getSelectClassName("statusPegawai")}
                  >
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusKepegawaianOptions.map((statusItem) => (
                      <SelectItem key={statusItem.value} value={statusItem.value}>
                        {statusItem.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError("statusPegawai")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenisPegawai" className="text-sm">
                  Jenis Pegawai <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.jenisPegawai}
                  onValueChange={(value) => handleSelectChange("jenisPegawai", value)}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(getFieldError("jenisPegawai"))}
                    className={getSelectClassName("jenisPegawai")}
                  >
                    <SelectValue placeholder="Pilih jenis pegawai" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisPegawaiOptions.map((jenis) => (
                      <SelectItem key={jenis.value} value={jenis.value}>
                        {jenis.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError("jenisPegawai")}
              </div>
              {selectedStatusPegawai === "PNS" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tmtCpns" className="text-sm">
                      TMT CPNS
                    </Label>
                    <Input
                      id="tmtCpns"
                      name="tmtCpns"
                      type="date"
                      max={todayString}
                      value={formData.tmtCpns}
                      onChange={handleInputChange}
                      aria-invalid={Boolean(getFieldError("tmtCpns"))}
                      className={getInputClassName("tmtCpns")}
                    />
                    {renderFieldError("tmtCpns")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tmtPns" className="text-sm">
                      TMT PNS <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tmtPns"
                      name="tmtPns"
                      type="date"
                      max={todayString}
                      value={formData.tmtPns}
                      onChange={handleInputChange}
                      aria-invalid={Boolean(getFieldError("tmtPns"))}
                      className={getInputClassName("tmtPns")}
                    />
                    {renderFieldError("tmtPns")}
                  </div>
                </>
              )}
              {selectedStatusPegawai === "PPPK" && (
                <div className="space-y-2">
                  <Label htmlFor="tmtPppk" className="text-sm">
                    TMT PPPK <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tmtPppk"
                    name="tmtPppk"
                    type="date"
                    max={todayString}
                    value={formData.tmtPppk}
                    onChange={handleInputChange}
                    aria-invalid={Boolean(getFieldError("tmtPppk"))}
                    className={getInputClassName("tmtPppk")}
                  />
                  {renderFieldError("tmtPppk")}
                </div>
              )}
            </div>
          </div>

          {/* Dokumen Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b border-border pb-2 pt-2">Lampiran Dokumen</h3>
            <div className="rounded-xl border-2 border-dashed border-border bg-secondary/10 hover:bg-secondary/20 transition-colors p-8">
              <input
                type="file"
                multiple
                onChange={handleFileAdd}
                className="hidden"
                id="dokumenInput"
              />
              <label htmlFor="dokumenInput" className="cursor-pointer block w-full h-full">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-base font-medium text-foreground">
                      Klik untuk upload dokumen
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF, JPG, PNG (Max. 5 MB per file)
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {dokumen.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Dokumen yang diupload ({dokumen.length}):
                </p>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto pr-2">
                  {dokumen.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm group relative hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="rounded-full p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3 pt-4 sm:pt-6 flex-col-reverse sm:flex-row">
          <Button
            variant="destructive"
            onClick={resetForm}
            className="text-xs sm:text-sm"
            disabled={submitting}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} className="bg-primary text-xs sm:text-sm" disabled={submitting}>
            {submitting ? "Menyimpan..." : "Tambah Pegawai"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
