"use client"

import { useEffect, useRef, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { User, Camera, Save, Upload, Shield, KeyRound } from "lucide-react"
import { cn } from "@/lib/utils"

const withCacheBust = (url?: string | null) => {
  if (!url) return ""
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}v=${Date.now()}`
}
const PROFILE_CACHE_KEY = "simpeg_admin_profile"

export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState<"profil" | "keamanan">("profil")
  const { toast } = useToast()
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSourceUrl, setCropSourceUrl] = useState<string>("")
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [cropImageSize, setCropImageSize] = useState({ width: 0, height: 0 })
  const [applyingCrop, setApplyingCrop] = useState(false)
  const [cropFilenameBase, setCropFilenameBase] = useState("profile")
  const [cropMimeType, setCropMimeType] = useState("image/jpeg")
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string>("")
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, offsetX: 0, offsetY: 0 })
  const CROP_BOX_SIZE = 280
  const CROP_OUTPUT_SIZE = 512
  const baseScale = Math.max(
    CROP_BOX_SIZE / Math.max(cropImageSize.width || 1, 1),
    CROP_BOX_SIZE / Math.max(cropImageSize.height || 1, 1)
  )

  const clampCropOffset = (
    offset: { x: number; y: number },
    zoomValue = cropZoom,
    imageSize = cropImageSize
  ) => {
    if (!imageSize.width || !imageSize.height) {
      return offset
    }

    const effectiveBaseScale = Math.max(
      CROP_BOX_SIZE / imageSize.width,
      CROP_BOX_SIZE / imageSize.height
    )
    const renderedWidth = imageSize.width * effectiveBaseScale * zoomValue
    const renderedHeight = imageSize.height * effectiveBaseScale * zoomValue
    const maxX = Math.max(0, (renderedWidth - CROP_BOX_SIZE) / 2)
    const maxY = Math.max(0, (renderedHeight - CROP_BOX_SIZE) / 2)

    return {
      x: Math.min(maxX, Math.max(-maxX, offset.x)),
      y: Math.min(maxY, Math.max(-maxY, offset.y)),
    }
  }
  
  // State for Profile
  const [profileData, setProfileData] = useState({
    nama: "Admin",
    email: "admin@instansi.go.id",
    telepon: "081234567890"
  })

  useEffect(() => {
    let mounted = true
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setProfileData({
          nama: parsed.nama ?? "Admin",
          email: parsed.email ?? "admin@instansi.go.id",
          telepon: parsed.telepon ?? "",
        })
        setPhotoPreview(parsed.foto ?? "")
      } catch {
      }
    }

    fetch('/api/admin/profile')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return

        const nextProfile = {
          nama: json.nama ?? 'Admin',
          email: json.email ?? 'admin@instansi.go.id',
          telepon: json.telepon ?? '',
        }

        setProfileData(nextProfile)
        setPhotoPreview(json.foto ?? '')
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
          ...nextProfile,
          foto: json.foto ?? "",
        }))
      })
      .catch(() => {
        // keep default state
      })

    return () => {
      mounted = false
    }
  }, [])

  // State for Password
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  })

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format tidak didukung",
        description: "Pilih file gambar (PNG atau JPG).",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Ukuran terlalu besar",
        description: "Maksimal ukuran file adalah 5 MB.",
        variant: "destructive",
      })
      return
    }

    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl)
      setCropPreviewUrl("")
    }

    const objectUrl = URL.createObjectURL(file)
    setCropSourceUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return objectUrl
    })
    setCropFilenameBase(file.name.replace(/\.[^.]+$/, "") || "profile")
    setCropMimeType(file.type || "image/jpeg")
    setCropImageSize({ width: 0, height: 0 })
    setCropZoom(1)
    setCropOffset({ x: 0, y: 0 })
    setCropOpen(true)

    e.currentTarget.value = ""
  }

  const applyCroppedPhoto = async () => {
    if (!cropSourceUrl || !cropImageSize.width || !cropImageSize.height) return

    setApplyingCrop(true)
    try {
      const img = new Image()
      const imageLoaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Gagal memuat gambar untuk crop"))
      })

      img.src = cropSourceUrl
      await imageLoaded

      const effectiveBaseScale = Math.max(
        CROP_BOX_SIZE / cropImageSize.width,
        CROP_BOX_SIZE / cropImageSize.height
      )
      const clampedOffset = clampCropOffset(cropOffset)
      const scale = effectiveBaseScale * cropZoom
      const renderedWidth = cropImageSize.width * scale
      const renderedHeight = cropImageSize.height * scale
      const imageLeft = CROP_BOX_SIZE / 2 - renderedWidth / 2 + clampedOffset.x
      const imageTop = CROP_BOX_SIZE / 2 - renderedHeight / 2 + clampedOffset.y
      const sourceX = Math.max(0, (0 - imageLeft) / scale)
      const sourceY = Math.max(0, (0 - imageTop) / scale)
      const sourceW = Math.min(cropImageSize.width - sourceX, CROP_BOX_SIZE / scale)
      const sourceH = Math.min(cropImageSize.height - sourceY, CROP_BOX_SIZE / scale)

      const canvas = document.createElement("canvas")
      canvas.width = CROP_OUTPUT_SIZE
      canvas.height = CROP_OUTPUT_SIZE
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Canvas tidak tersedia")
      }

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        0,
        0,
        CROP_OUTPUT_SIZE,
        CROP_OUTPUT_SIZE
      )

      const outputMime = cropMimeType === "image/png" ? "image/png" : "image/jpeg"
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (!result) {
            reject(new Error("Gagal memproses hasil crop"))
            return
          }
          resolve(result)
        }, outputMime, 0.92)
      })

      const extension = outputMime === "image/png" ? "png" : "jpg"
      const file = new File([blob], `${cropFilenameBase}-cropped.${extension}`, { type: outputMime })
      setPhotoFile(file)

      if (cropPreviewUrl) {
        URL.revokeObjectURL(cropPreviewUrl)
      }
      const previewUrl = URL.createObjectURL(blob)
      setCropPreviewUrl(previewUrl)
      setPhotoPreview(previewUrl)
      setCropOpen(false)
      setCropOffset({ x: 0, y: 0 })
      setCropZoom(1)
    } catch {
      toast({
        title: "Gagal crop foto",
        description: "Silakan coba unggah ulang gambar.",
        variant: "destructive",
      })
    } finally {
      setApplyingCrop(false)
    }
  }

  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      offsetX: cropOffset.x,
      offsetY: cropOffset.y,
    }
    setIsDraggingCrop(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCrop) return

    const deltaX = e.clientX - dragStartRef.current.pointerX
    const deltaY = e.clientY - dragStartRef.current.pointerY
    setCropOffset(clampCropOffset({
      x: dragStartRef.current.offsetX + deltaX,
      y: dragStartRef.current.offsetY + deltaY,
    }))
  }

  const handleCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCrop) return
    setIsDraggingCrop(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)

    const formData = new FormData()
    formData.append('nama', profileData.nama)
    formData.append('email', profileData.email)
    formData.append('telepon', profileData.telepon)

    if (photoFile) {
      formData.append('foto', photoFile)
    }

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Gagal menyimpan profil')
      }

      const json = await response.json()
      const normalizedFoto = withCacheBust(json.foto ?? photoPreview)
      setPhotoPreview(normalizedFoto)
      setPhotoFile(null)
      if (cropPreviewUrl) {
        URL.revokeObjectURL(cropPreviewUrl)
        setCropPreviewUrl("")
      }
      window.dispatchEvent(new CustomEvent('admin-profile-updated', {
        detail: {
          nama: json.nama ?? profileData.nama,
          email: json.email ?? profileData.email,
          foto: normalizedFoto,
        },
      }))
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
        nama: json.nama ?? profileData.nama,
        email: json.email ?? profileData.email,
        telepon: json.telepon ?? profileData.telepon,
        foto: normalizedFoto,
      }))

      toast({
        title: "Profil diperbarui",
        description: "Informasi profil Anda berhasil disimpan.",
      })
    } catch {
      toast({
        title: "Gagal memperbarui profil",
        description: "Silakan periksa data dan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setSavingProfile(false)
    }
  }

  useEffect(() => {
    return () => {
      if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl)
      if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl)
    }
  }, [cropSourceUrl, cropPreviewUrl])

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: "Gagal mengubah password",
        description: "Konfirmasi password tidak cocok.",
        variant: "destructive"
      })
      return
    }
    if (passwordData.new.length < 6) {
      toast({
        title: "Gagal mengubah password",
        description: "Password baru minimal 6 karakter.",
        variant: "destructive"
      })
      return
    }

    setSavingPassword(true)
    try {
      const response = await fetch('/api/admin/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.current,
          new_password: passwordData.new,
          new_password_confirmation: passwordData.confirm,
        }),
      })

      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const json = isJson ? await response.json().catch(() => null) : null

      if (response.redirected || !response.ok || !isJson || !json) {
        const validationErrors = json?.errors ? Object.values(json.errors).flat() : []
        const firstValidationError = validationErrors[0]
        const errorMessage =
          typeof firstValidationError === 'string'
            ? firstValidationError
            : json?.message || 'Respons server tidak valid. Coba login ulang lalu ulangi.'
        throw new Error(errorMessage)
      }

      toast({
        title: "Password diubah",
        description: json?.message || "Password Anda berhasil diperbarui. Silakan login ulang.",
      })
      setPasswordData({ current: "", new: "", confirm: "" })
    } catch (err: any) {
      toast({
        title: "Gagal mengubah password",
        description: err?.message || "Pastikan password saat ini benar.",
        variant: "destructive",
      })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <AdminLayout title="Pengaturan">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Tabs Navigation */}
        <div className="flex space-x-1 rounded-xl bg-secondary/50 p-1">
          <button
            onClick={() => setActiveTab("profil")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              activeTab === "profil"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
            )}
          >
            <User className="h-4 w-4" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab("keamanan")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              activeTab === "keamanan"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
            )}
          >
            <Shield className="h-4 w-4" />
            Keamanan
          </button>
        </div>

        {/* Content Area */}
        {activeTab === "profil" ? (
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            {/* Left Column: Photo Section */}
            <Card className="p-6 flex flex-col items-center text-center space-y-4 h-fit border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={photoPreview || undefined} />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {(profileData.nama || 'AD').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0">
                  <Button
                    type="button"
                    size="icon"
                    className="rounded-full h-8 w-8 shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Foto Profil</h3>
                <p className="text-xs text-muted-foreground">
                  Foto ini akan ditampilkan di topbar (pojok kanan atas).
                </p>
                <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-md border border-border">
                  Format PNG, JPG (Maks. 5 MB)
                </div>
              </div>
              <Button variant="outline" className="w-full text-xs" onClick={() => document.getElementById('photo-upload')?.click()}>
                <Upload className="mr-2 h-3 w-3" />
                Unggah Foto
              </Button>
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleFotoChange}
              />
            </Card>

            {/* Right Column: Info Form */}
            <Card className="p-6 border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Informasi Admin</h3>
                <p className="text-sm text-muted-foreground">Kelola informasi pribadi dan kontak Anda.</p>
              </div>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input 
                    id="nama" 
                    value={profileData.nama} 
                    onChange={(e) => setProfileData({...profileData, nama: e.target.value})}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email} 
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telepon">Nomor Telepon</Label>
                  <Input 
                    id="telepon" 
                    value={profileData.telepon} 
                    onChange={(e) => setProfileData({...profileData, telepon: e.target.value})}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="gap-2 bg-primary text-primary-foreground" disabled={savingProfile}>
                    <Save className="h-4 w-4" />
                    {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        ) : (
          /* Security Tab Content */
          <Card className="p-6 max-w-2xl mx-auto border-border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
            <div className="mb-6 flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Ubah Password</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Untuk menjaga keamanan akun, Anda dapat mengubah kata sandi di sini. Pastikan kata sandi baru kuat dan berbeda dari kata sandi sebelumnya. Setelah diubah, Anda akan diminta untuk masuk kembali menggunakan kata sandi yang baru.
                </p>
              </div>
            </div>
            
            <form onSubmit={handlePasswordSave} className="space-y-4 border-t border-border pt-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Password Saat Ini</Label>
                <Input 
                  id="current-password" 
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  className="bg-secondary/50"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password Baru (Minimal 6 karakter)</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                    className="bg-secondary/50"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button type="submit" className="gap-2 bg-primary text-primary-foreground" disabled={savingPassword}>
                  <Save className="h-4 w-4" />
                  {savingPassword ? 'Menyimpan...' : 'Ubah Password'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Sesuaikan Foto Profil</DialogTitle>
            <DialogDescription>
              Geser untuk memposisikan gambar dan gunakan slider untuk zoom.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              <div
                className="relative overflow-hidden rounded-xl border border-border bg-black/80 touch-none"
                style={{ width: CROP_BOX_SIZE, height: CROP_BOX_SIZE }}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerCancel={handleCropPointerUp}
                onContextMenu={(e) => e.preventDefault()}
              >
                {cropSourceUrl ? (
                  <img
                    src={cropSourceUrl}
                    alt="Crop preview"
                    className={cn("pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none", isDraggingCrop ? "cursor-grabbing" : "cursor-grab")}
                    draggable={false}
                    onLoad={(e) => {
                      const target = e.currentTarget
                      const nextSize = {
                        width: target.naturalWidth,
                        height: target.naturalHeight,
                      }
                      setCropImageSize(nextSize)
                      setCropOffset((prev) => clampCropOffset(prev, cropZoom, nextSize))
                    }}
                    style={{
                      transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${cropZoom * baseScale})`,
                      transformOrigin: "center center",
                    }}
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Zoom</span>
                <span>{cropZoom.toFixed(1)}x</span>
              </div>
              <Slider
                min={1}
                max={3}
                step={0.05}
                value={[cropZoom]}
                onValueChange={(values) => {
                  const nextZoom = values[0]
                  setCropZoom(nextZoom)
                  setCropOffset((prev) => clampCropOffset(prev, nextZoom))
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCropOpen(false)
                setCropZoom(1)
                setCropOffset({ x: 0, y: 0 })
              }}
            >
              Batal
            </Button>
            <Button type="button" onClick={applyCroppedPhoto} disabled={applyingCrop || !cropSourceUrl}>
              {applyingCrop ? "Memproses..." : "Pakai Foto Ini"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
