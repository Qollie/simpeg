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
import type { Pegawai, Dokumen } from "@/lib/types"
import { departemenList, golonganList } from "@/lib/mock-data"

interface AddEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (pegawai: Pegawai, dokumen: Dokumen[]) => void
}

const agamaList = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"]
const statusPerkawinanList = ["Belum Menikah", "Menikah", "Cerai Hidup", "Cerai Mati"]
const jenisKelaminList = ["Laki-laki", "Perempuan"]

const pendidikanList = [
  { label: "SD", min: "I/a", max: "II/a" },
  { label: "SLTP", min: "I/c", max: "II/c" },
  { label: "SLTP Kejuruan", min: "I/c", max: "II/d" },
  { label: "SLTA/SLTA Kejuruan/Diploma", min: "II/a", max: "III/b" },
  { label: "Diploma II", min: "II/b", max: "III/b" },
  { label: "SGPLB", min: "II/b", max: "III/c" },
  { label: "Sarjana Muda / D-III", min: "II/c", max: "III/c" },
  { label: "Sarjana/D-IV", min: "III/a", max: "III/d" },
  { label: "S-2 / Dokter / Apoteker / Ners", min: "III/b", max: "IV/a" },
  { label: "S-3 / Doktor", min: "III/c", max: "IV/b" },
]

export function AddEmployeeModal({
  isOpen,
  onClose,
  onAdd,
}: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    nip: "",
    nik: "",
    nama: "",
    gelarDepan: "",
    gelarBelakang: "",
    jabatan: "",
    departemen: "",
    golongan: "",
    status: "Aktif",
    tanggalMasuk: "",
    tmtGolongan: "",
    email: "",
    telepon: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "",
    agama: "",
    statusPerkawinan: "",
    alamat: "",
    provinsi: "",
    kota: "",
    kecamatan: "",
    kodePos: "",
    pendidikanTerakhir: "",
    noBpjs: "",
    noNpwp: "",
  })

  const [dokumen, setDokumen] = useState<File[]>([])
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const { toast } = useToast()

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      setFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    if (
      !formData.nip ||
      !formData.nama ||
      !formData.jabatan ||
      !formData.departemen ||
      !formData.golongan ||
      !formData.email ||
      !formData.telepon ||
      !formData.tanggalLahir ||
      !formData.jenisKelamin
    ) {
      toast({
        title: "Validasi Gagal",
        description: "Harap isi semua field yang wajib diisi (ditandai dengan *)",
        variant: "destructive",
      })
      return
    }

    // Generate ID untuk pegawai baru
    const newId = Date.now().toString()

    // Convert dokumen files menjadi Dokumen objects
    const dokumenObjects: Dokumen[] = dokumen.map((file) => ({
      id: Date.now().toString() + Math.random(),
      nama: file.name,
      tipe: file.type.split("/")[1].toUpperCase(),
      ukuran: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      tanggalUpload: new Date().toISOString().split("T")[0],
    }))

    const newPegawai: any = {
      id: newId,
      nip: formData.nip,
      nik: formData.nik,
      nama: formData.nama,
      gelarDepan: formData.gelarDepan,
      gelarBelakang: formData.gelarBelakang,
      jabatan: formData.jabatan,
      departemen: formData.departemen,
      golongan: formData.golongan,
      status: formData.status as "Aktif" | "Cuti" | "Pensiun",
      tanggalMasuk: formData.tanggalMasuk,
      tmtGolongan: formData.tmtGolongan,
      email: formData.email,
      telepon: formData.telepon,
      tempatLahir: formData.tempatLahir,
      tanggalLahir: formData.tanggalLahir,
      jenisKelamin: formData.jenisKelamin,
      agama: formData.agama,
      statusPerkawinan: formData.statusPerkawinan,
      alamat: formData.alamat,
      provinsi: formData.provinsi,
      kota: formData.kota,
      kecamatan: formData.kecamatan,
      kodePos: formData.kodePos,
      dokumen: dokumenObjects,
      foto: fotoPreview,
      pendidikanTerakhir: formData.pendidikanTerakhir,
      noBpjs: formData.noBpjs,
      noNpwp: formData.noNpwp,
    }

    onAdd(newPegawai, dokumenObjects)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      nip: "",
      nik: "",
      nama: "",
      gelarDepan: "",
      gelarBelakang: "",
      jabatan: "",
      departemen: "",
      golongan: "",
      status: "Aktif",
      tanggalMasuk: "",
      tmtGolongan: "",
      email: "",
      telepon: "",
      tempatLahir: "",
      tanggalLahir: "",
      jenisKelamin: "",
      agama: "",
      statusPerkawinan: "",
      alamat: "",
      provinsi: "",
      kota: "",
      kecamatan: "",
      kodePos: "",
      pendidikanTerakhir: "",
      noBpjs: "",
      noNpwp: "",
    })
    setDokumen([])
    setFoto(null)
    setFotoPreview(null)
    onClose()
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
                <Label htmlFor="nip" className="text-sm">
                  NIP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nip"
                  name="nip"
                  placeholder="Nomor Induk Pegawai"
                  value={formData.nip}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nik" className="text-sm">
                  NIK
                </Label>
                <Input
                  id="nik"
                  name="nik"
                  placeholder="Nomor Induk Kependudukan"
                  value={formData.nik}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="gelarDepan" className="text-sm">
                  Gelar Depan
                </Label>
                <Input
                  id="gelarDepan"
                  name="gelarDepan"
                  placeholder="Dr."
                  value={formData.gelarDepan}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                <Label htmlFor="nama" className="text-xs sm:text-sm">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nama"
                  name="nama"
                  placeholder="Nama lengkap"
                  value={formData.nama}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="gelarBelakang" className="text-sm">
                  Gelar Belakang
                </Label>
                <Input
                  id="gelarBelakang"
                  name="gelarBelakang"
                  placeholder="S.Kom"
                  value={formData.gelarBelakang}
                  onChange={handleInputChange}
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
                  name="jabatan"
                  placeholder="Posisi/Jabatan"
                  value={formData.jabatan}
                  onChange={handleInputChange}
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
                    handleSelectChange("departemen", value)
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
                    handleSelectChange("golongan", value)
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
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="pendidikanTerakhir" className="text-xs sm:text-sm">
                  Pendidikan Terakhir
                </Label>
                <Select
                  value={formData.pendidikanTerakhir}
                  onValueChange={(value) => handleSelectChange("pendidikanTerakhir", value)}
                >
                  <SelectTrigger className="w-full bg-secondary text-sm">
                    <SelectValue placeholder="Pilih Pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendidikanList.map((p) => (
                      <SelectItem key={p.label} value={p.label}>{p.label} ({p.min} - {p.max})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Identitas Resmi Tambahan */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
                className="bg-secondary text-sm"
              />
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
                className="bg-secondary text-sm"
              />
            </div>
          </div>

          {/* Data Pribadi Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Data Pribadi</h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tempatLahir" className="text-sm">
                  Tempat Lahir
                </Label>
                <Input
                  id="tempatLahir"
                  name="tempatLahir"
                  placeholder="Kota kelahiran"
                  value={formData.tempatLahir}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggalLahir" className="text-sm">
                  Tanggal Lahir <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tanggalLahir"
                  name="tanggalLahir"
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="jenisKelamin" className="text-sm">
                  Jenis Kelamin <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.jenisKelamin}
                  onValueChange={(value) => handleSelectChange("jenisKelamin", value)}
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
                <Label htmlFor="agama" className="text-sm">Agama</Label>
                <Select
                  value={formData.agama}
                  onValueChange={(value) => handleSelectChange("agama", value)}
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
              <div className="space-y-2">
                <Label htmlFor="statusPerkawinan" className="text-sm">Status Perkawinan</Label>
                <Select
                  value={formData.statusPerkawinan}
                  onValueChange={(value) => handleSelectChange("statusPerkawinan", value)}
                >
                  <SelectTrigger className="bg-secondary text-sm">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusPerkawinanList.map((sp) => (
                      <SelectItem key={sp} value={sp}>{sp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Alamat Domisili Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Alamat Domisili</h3>
            <div className="space-y-2">
              <Label htmlFor="alamat" className="text-sm">Alamat Lengkap (Jalan, RT/RW)</Label>
              <Input
                id="alamat"
                name="alamat"
                placeholder="Jl. Contoh No. 123, RT 01 RW 02"
                value={formData.alamat}
                onChange={handleInputChange}
                className="bg-secondary text-sm"
              />
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="provinsi" className="text-sm">Provinsi</Label>
                <Input
                  id="provinsi"
                  name="provinsi"
                  value={formData.provinsi}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kota" className="text-sm">Kota/Kabupaten</Label>
                <Input
                  id="kota"
                  name="kota"
                  value={formData.kota}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kecamatan" className="text-sm">Kecamatan</Label>
                <Input
                  id="kecamatan"
                  name="kecamatan"
                  value={formData.kecamatan}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kodePos" className="text-sm">Kode Pos</Label>
                <Input
                  id="kodePos"
                  name="kodePos"
                  value={formData.kodePos}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Status & Tanggal Section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Status & Tanggal</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="status" className="text-xs sm:text-sm">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="bg-secondary text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Cuti">Cuti</SelectItem>
                    <SelectItem value="Pensiun">Pensiun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="tanggalMasuk" className="text-xs sm:text-sm">
                  Tanggal Masuk <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tanggalMasuk"
                  name="tanggalMasuk"
                  type="date"
                  value={formData.tanggalMasuk}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="tmtGolongan" className="text-xs sm:text-sm">
                  TMT Golongan
                </Label>
                <Input
                  id="tmtGolongan"
                  name="tmtGolongan"
                  type="date"
                  value={formData.tmtGolongan}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
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
                  className="bg-secondary text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="telepon" className="text-xs sm:text-sm">
                  Telepon <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telepon"
                  name="telepon"
                  placeholder="081234567890"
                  value={formData.telepon}
                  onChange={handleInputChange}
                  className="bg-secondary text-sm"
                />
              </div>
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
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} className="bg-primary text-xs sm:text-sm">
            Tambah Pegawai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
