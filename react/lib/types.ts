export interface IdentitasResmi {
  nipIdResmi: string
  nik?: string
  noBpjs?: string
  noNpwp?: string
  karpeg?: string
  karsuKarsi?: string
  taspen?: string
}

export interface Kepegawaian {
  nipKepegawaian: string
  statusPegawai?: string
  jenisPegawai?: string
  tmtCpns?: string
  tmtPns?: string
  masaKerjaTahun?: number
  masaKerjaBulan?: number
}

export interface RiwayatPangkat {
  idRiwayat: number
  nipRiwayat: string
  idPangkatRiwayat?: number
  tmtPangkat?: string
  tmtSelesai?: string
  status?: string
  pangkat?: {
    idPangkat?: number
    namaPangkat?: string
  }
}

export interface EfilePegawai {
  idFile: number
  nipEfile: string
  jenisDokumen?: string
  namaFile?: string
  filePath?: string
  waktuUpload?: string
}

export interface Pegawai {
  nipPegawai: string
  nama: string
  gelarDepan?: string
  gelarBelakang?: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: string
  agama?: string
  alamat?: string
  email?: string
  noHp: string
  foto?: string
  jabatan?: string
  departemen?: string
  golongan?: string
  status?: string
  tanggalMasuk?: string
  
  // Relasi
  identitasResmi?: IdentitasResmi
  kepegawaian?: Kepegawaian
  riwayatPangkat?: RiwayatPangkat[]
  efiles?: EfilePegawai[]
}

export interface Dokumen {
  id: string
  nama: string
  tipe: string
  ukuran: string
  tanggalUpload: string
  url?: string
}

export interface StatistikDashboard {
  totalPegawai: number
  totalDokumen: number
  pegawaiAktif: number
  pegawaiCuti: number
  updateTerbaru: UpdateTerbaru[]
}

export interface UpdateTerbaru {
  id: string
  aksi: string
  detail: string
  waktu: string
  user: string
}
