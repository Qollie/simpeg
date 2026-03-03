import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Building2,
  Calendar,
  Mail,
  Phone,
  FileText,
  X,
  Briefcase,
  CreditCard,
  MapPin,
  IdCard,
  Clock,
} from "lucide-react"
import type { Pegawai } from "@/lib/types"
import { calculateWorkDuration } from "@/lib/utils"

interface PropsModalLihatPegawai {
  pegawai: Pegawai | null
  terbuka: boolean
  tutup: () => void
  hapusDokumen?: (nipPegawai: string, idFile: string) => void
}

export function ModalLihatPegawai({
  pegawai,
  terbuka,
  tutup,
  hapusDokumen,
}: PropsModalLihatPegawai) {
  if (!pegawai) return null

  const formatDate = (date?: string) => {
    if (!date) return "-"
    try {
      return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return date
    }
  }

  const DataRow = ({ label, value, icon: Icon, fullWidth }: any) => (
    <div className={fullWidth ? "py-2 border-b border-border/50 last:border-0" : "flex justify-between items-center gap-2 py-2 border-b border-border/50 last:border-0"}>
      <div className="flex items-center gap-2 text-muted-foreground min-w-fit">
        {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
        <span className="text-xs uppercase tracking-wide font-medium">{label}</span>
      </div>
      <span className={fullWidth ? "text-sm font-medium text-foreground block mt-1 whitespace-normal break-words" : "text-sm font-medium text-foreground text-right whitespace-normal break-words flex-1 min-w-0"}>{value || "—"}</span>
    </div>
  )

  const SectionTitle = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20 mb-3 mt-4 first:mt-0">
      {Icon && <Icon className="h-4 w-4 text-primary flex-shrink-0" />}
      <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">{title}</h3>
    </div>
  )

  return (
    <Dialog open={terbuka} onOpenChange={tutup}>
      <DialogContent className="max-h-[90vh] h-[90vh] w-[95vw] md:w-[90vw] lg:min-w-[900px] max-w-5xl overflow-hidden p-0 border-none bg-card rounded-xl sm:rounded-2xl shadow-2xl flex flex-col [&>button]:hidden">
        <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
          
          {/* KIRI: Foto Full Cover dengan Info Overlay */}
          <div className="relative w-full md:w-[320px] lg:w-[480px] bg-muted flex-shrink-0 min-h-[250px] md:min-h-full p-0 overflow-hidden">
            {/* Foto Pegawai */}
            <img 
              src={pegawai.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(pegawai.nama)}&background=random&size=800`} 
              alt={pegawai.nama}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            {/* Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col justify-end h-full pointer-events-none">
              <h2 className="text-2xl font-bold leading-tight mb-1">
                {pegawai.gelarDepan ? `${pegawai.gelarDepan} ` : ""}{pegawai.nama}{pegawai.gelarBelakang ? `, ${pegawai.gelarBelakang}` : ""}
              </h2>
              <p className="text-white/90 font-medium text-sm mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-white/80" />
                {pegawai.jabatan || "—"}
              </p>

              <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider">NIP</p>
                  <p className="font-mono font-semibold text-sm">{pegawai.nipPegawai}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider">Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${pegawai.status === 'Aktif' ? 'bg-green-500' : pegawai.status === 'Cuti' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                    <span className="font-medium text-sm">{pegawai.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KANAN: Detail Informasi Lengkap (Scrollable) */}
          <div className="flex-1 flex flex-col bg-card min-w-0">
            {/* Header & Close Button */}
            <div className="flex items-center justify-between p-6 pb-3 border-b border-border/50">
              <h2 className="text-xl font-bold tracking-tight">Detail Lengkap</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={tutup}
                className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* IDENTITAS RESMI */}
              {(pegawai.identitasResmi || pegawai.nipPegawai) && (
                <div>
                  <SectionTitle title="Identitas Resmi" icon={IdCard} />
                  <div className="space-y-0">
                    <DataRow label="NIK" value={pegawai.identitasResmi?.nik} />
                    <DataRow label="No. BPJS" value={pegawai.identitasResmi?.noBpjs} />
                    <DataRow label="No. NPWP" value={pegawai.identitasResmi?.noNpwp} />
                    <DataRow label="Karpeg" value={pegawai.identitasResmi?.karpeg} />
                    <DataRow label="Karsu/Karsi" value={pegawai.identitasResmi?.karsuKarsi} />
                    <DataRow label="Taspen" value={pegawai.identitasResmi?.taspen} />
                  </div>
                </div>
              )}

              {/* DATA KEPEGAWAIAN */}
              <div>
                <SectionTitle title="Data Kepegawaian" icon={CreditCard} />
                <div className="space-y-0">
                  <DataRow label="Departemen" value={pegawai.departemen} icon={Building2} />
                  <DataRow label="Golongan" value={pegawai.golongan} />
                  <DataRow label="Jabatan" value={pegawai.jabatan} icon={Briefcase} />
                  <DataRow label="Tanggal Masuk" value={formatDate(pegawai.tanggalMasuk)} icon={Calendar} />
                  {pegawai.tanggalMasuk && <DataRow label="Lama Kerja" value={calculateWorkDuration(pegawai.tanggalMasuk)} icon={Clock} />}
                </div>
              </div>

              {/* DATA PRIVAT KEPEGAWAIAN */}
              {pegawai.kepegawaian && (
                <div>
                  <SectionTitle title="Kepegawaian Detail" icon={CreditCard} />
                  <div className="space-y-0">
                    <DataRow label="Status Pegawai" value={pegawai.kepegawaian.statusPegawai} />
                    <DataRow label="Jenis Pegawai" value={pegawai.kepegawaian.jenisPegawai} />
                    <DataRow label="TMT CPNS" value={formatDate(pegawai.kepegawaian.tmtCpns)} />
                    <DataRow label="TMT PNS" value={formatDate(pegawai.kepegawaian.tmtPns)} />
                    {pegawai.kepegawaian.masaKerjaTahun !== undefined && (
                      <DataRow label="Masa Kerja" value={`${pegawai.kepegawaian.masaKerjaTahun}t ${pegawai.kepegawaian.masaKerjaBulan}b`} />
                    )}
                  </div>
                </div>
              )}

              {/* DATA PRIBADI */}
              <div>
                <SectionTitle title="Data Pribadi" icon={User} />
                <div className="space-y-0">
                  <DataRow label="Tempat Lahir" value={pegawai.tempatLahir} icon={MapPin} />
                  <DataRow label="Tanggal Lahir" value={formatDate(pegawai.tanggalLahir)} icon={Calendar} />
                  <DataRow label="Jenis Kelamin" value={pegawai.jenisKelamin} />
                  <DataRow label="Agama" value={pegawai.agama} />
                </div>
              </div>

              {/* KONTAK & ALAMAT */}
              <div>
                <SectionTitle title="Kontak & Alamat" icon={Phone} />
                <div className="space-y-0">
                  <DataRow label="Alamat" value={pegawai.alamat} icon={MapPin} />
                  <DataRow label="Email" value={pegawai.email} icon={Mail} />
                  <DataRow label="No. HP" value={pegawai.noHp} icon={Phone} />
                </div>
              </div>

              {/* RIWAYAT PANGKAT */}
              {pegawai.riwayatPangkat && pegawai.riwayatPangkat.length > 0 && (
                <div>
                  <SectionTitle title={`Riwayat Pangkat (${pegawai.riwayatPangkat.length})`} icon={Calendar} />
                  <div className="space-y-3">
                    {pegawai.riwayatPangkat.map((riwayat, idx) => (
                      <div key={riwayat.idRiwayat} className="p-3 rounded border border-border/50 bg-muted/20 text-xs">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="font-semibold text-foreground">{riwayat.pangkat?.namaPangkat || `Pangkat #${idx + 1}`}</span>
                          {riwayat.status && <Badge variant="outline" className="text-[10px]">{riwayat.status}</Badge>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-muted-foreground">TMT</p>
                            <p className="font-medium">{formatDate(riwayat.tmtPangkat)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Selesai</p>
                            <p className="font-medium">{formatDate(riwayat.tmtSelesai) || "—"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FILE E-PEGAWAI */}
              {pegawai.efiles && pegawai.efiles.length > 0 && (
                <div>
                  <SectionTitle title={`File E-Pegawai (${pegawai.efiles.length})`} icon={FileText} />
                  <div className="space-y-2">
                    {pegawai.efiles.map((file: any) => (
                      <div key={file.idFile} className="p-3 rounded border border-border/50 bg-muted/20 flex items-start gap-2">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{file.namaFile || "File"}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge variant="secondary" className="text-[9px]">{file.jenisDokumen || "DOKUMEN"}</Badge>
                            <span>{formatDate(file.waktuUpload)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!pegawai.efiles || pegawai.efiles.length === 0 ? (
                <div className="p-4 text-center rounded border border-dashed border-border/30 bg-muted/10">
                  <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-muted-foreground italic">Belum ada file</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
