import type { IdentitasResmi, Kepegawaian, Pegawai } from "@/lib/types"
import { calculateMasaKerja } from "@/lib/pegawai-form-shared"

export type AddPegawaiFormState = {
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
  masaKerjaTahun: string
  masaKerjaBulan: string
}

export const createInitialAddPegawaiForm = (): AddPegawaiFormState => ({
  nipPegawai: "",
  nama: "",
  gelarDepan: "",
  gelarBelakang: "",
  jabatan: "",
  departemen: "",
  golongan: "",
  status: "Aktif",
  tanggalMasuk: "",
  email: "",
  noHp: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  agama: "",
  alamat: "",
  nik: "",
  noBpjs: "",
  noNpwp: "",
  karpeg: "",
  karsuKarsi: "",
  taspen: "",
  statusPegawai: "",
  jenisPegawai: "",
  tmtCpns: "",
  tmtPns: "",
  masaKerjaTahun: "0",
  masaKerjaBulan: "0",
})

export const ensureIdentitasResmi = (pegawai: Pegawai, current?: Partial<IdentitasResmi>): IdentitasResmi => ({
  nipIdResmi: current?.nipIdResmi ?? pegawai.identitasResmi?.nipIdResmi ?? pegawai.nipPegawai,
  nik: current?.nik ?? "",
  noBpjs: current?.noBpjs ?? "",
  noNpwp: current?.noNpwp ?? "",
  karpeg: current?.karpeg ?? "",
  karsuKarsi: current?.karsuKarsi ?? "",
  taspen: current?.taspen ?? "",
})

export const ensureKepegawaian = (pegawai: Pegawai, current?: Partial<Kepegawaian>): Kepegawaian => ({
  nipKepegawaian: current?.nipKepegawaian ?? pegawai.kepegawaian?.nipKepegawaian ?? pegawai.nipPegawai,
  statusPegawai: current?.statusPegawai ?? pegawai.kepegawaian?.statusPegawai ?? pegawai.status ?? "",
  jenisPegawai: current?.jenisPegawai ?? pegawai.kepegawaian?.jenisPegawai ?? pegawai.departemen ?? "",
  tmtCpns: current?.tmtCpns ?? pegawai.kepegawaian?.tmtCpns ?? pegawai.tanggalMasuk ?? "",
  tmtPns: current?.tmtPns ?? pegawai.kepegawaian?.tmtPns ?? "",
  masaKerjaTahun: current?.masaKerjaTahun ?? pegawai.kepegawaian?.masaKerjaTahun ?? 0,
  masaKerjaBulan: current?.masaKerjaBulan ?? pegawai.kepegawaian?.masaKerjaBulan ?? 0,
})

export const normalizePegawaiToEditForm = (pegawai: Pegawai): Partial<Pegawai> => {
  const masaKerja = calculateMasaKerja(pegawai.kepegawaian?.tmtPns ?? pegawai.tanggalMasuk ?? "")

  return {
    ...pegawai,
    status: pegawai.status ?? pegawai.kepegawaian?.statusPegawai ?? "",
    departemen: pegawai.departemen ?? pegawai.kepegawaian?.jenisPegawai ?? "",
    identitasResmi: ensureIdentitasResmi(pegawai, pegawai.identitasResmi),
    kepegawaian: ensureKepegawaian(pegawai, {
      ...pegawai.kepegawaian,
      masaKerjaTahun: masaKerja.tahun,
      masaKerjaBulan: masaKerja.bulan,
    }),
  }
}
