import type { Dokumen, EfilePegawai, IdentitasResmi, Kepegawaian, Pegawai } from "@/lib/types"
import {
  jenisPegawaiLabelFromValue,
  statusKepegawaianLabelFromValue,
} from "@/lib/pegawai-form-shared"

type AddPegawaiFormData = {
  nipPegawai: string
  nama: string
  gelarDepan: string
  gelarBelakang: string
  jabatan: string
  departemen: string
  golongan: string
  status: "Aktif" | "Cuti" | "Pensiun"
  tanggalMasuk: string
  email: string
  noHp: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: string
  agama: string
  alamat: string
  nik: string
  noBpjs: string
  noNpwp: string
  karpeg: string
  karsuKarsi: string
  taspen: string
  statusPegawai: string
  jenisPegawai: string
  tmtCpns: string
  tmtPns: string
  tmtPppk: string
}

type MasaKerja = {
  tahun: number
  bulan: number
}

type BuildAddPegawaiPayloadParams = {
  formData: AddPegawaiFormData
  fotoPreview: string | null
  efiles: EfilePegawai[]
  masaKerja: MasaKerja
}

type BuildEditPegawaiPayloadParams = {
  pegawai: Pegawai
  formData: Partial<Pegawai>
  identitasResmi: IdentitasResmi
  kepegawaian: Kepegawaian
}

export const buildDokumenObjects = (files: File[]): Dokumen[] => {
  const timestamp = Date.now()

  return files.map((file, index) => ({
    id: `${timestamp}-${index}`,
    nama: file.name,
    tipe: (file.type.split("/")[1] || "").toUpperCase(),
    ukuran: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    tanggalUpload: new Date().toISOString().split("T")[0],
  }))
}

export const buildEfilesFromDokumen = (dokumen: Dokumen[], nipPegawai: string): EfilePegawai[] => {
  return dokumen.map((doc, index) => ({
    idFile: index + 1,
    nipEfile: nipPegawai,
    jenisDokumen: doc.tipe,
    namaFile: doc.nama,
    filePath: doc.url ?? "",
    waktuUpload: doc.tanggalUpload,
  }))
}

export const buildAddPegawaiPayload = ({
  formData,
  fotoPreview,
  efiles,
  masaKerja,
}: BuildAddPegawaiPayloadParams): Pegawai => {
  return {
    nipPegawai: formData.nipPegawai,
    nama: formData.nama,
    gelarDepan: formData.gelarDepan || undefined,
    gelarBelakang: formData.gelarBelakang || undefined,
    jabatan: formData.jabatan || undefined,
    departemen: formData.departemen || undefined,
    golongan: formData.golongan || undefined,
    status: formData.status,
    tanggalMasuk: formData.tanggalMasuk || undefined,
    email: formData.email || undefined,
    noHp: formData.noHp,
    foto: fotoPreview || undefined,
    tempatLahir: formData.tempatLahir,
    tanggalLahir: formData.tanggalLahir,
    jenisKelamin: formData.jenisKelamin,
    agama: formData.agama || undefined,
    alamat: formData.alamat || undefined,
    identitasResmi: {
      nipIdResmi: formData.nipPegawai,
      nik: formData.nik || undefined,
      noBpjs: formData.noBpjs || undefined,
      noNpwp: formData.noNpwp || undefined,
      karpeg: formData.karpeg || undefined,
      karsuKarsi: formData.karsuKarsi || undefined,
      taspen: formData.taspen || undefined,
    },
    kepegawaian: {
      nipKepegawaian: formData.nipPegawai,
      statusPegawai: statusKepegawaianLabelFromValue(formData.statusPegawai),
      jenisPegawai: jenisPegawaiLabelFromValue(formData.jenisPegawai),
      tmtCpns: formData.tmtCpns || undefined,
      tmtPns: formData.tmtPns || undefined,
      tmtPppk: formData.tmtPppk || undefined,
      masaKerjaTahun: masaKerja.tahun,
      masaKerjaBulan: masaKerja.bulan,
    },
    efiles,
  }
}

export const buildEditPegawaiPayload = ({
  pegawai,
  formData,
  identitasResmi,
  kepegawaian,
}: BuildEditPegawaiPayloadParams): Pegawai => {
  return {
    ...pegawai,
    ...formData,
    identitasResmi,
    kepegawaian,
  } as Pegawai
}
