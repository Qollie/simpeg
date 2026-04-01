import type { IdentitasResmi, Kepegawaian, Pegawai } from "@/lib/types"
import { calculateMasaKerja } from "@/lib/pegawai-form-shared"
import {
  jenisPegawaiValueFromValueOrLabel,
  statusKepegawaianValueFromValueOrLabel,
  departemenValueFromValueOrLabel,
  statusInternalValueFromValueOrLabel,
  agamaValueFromValueOrLabel,
  jenisKelaminValueFromValueOrLabel,
  golonganValueFromValueOrLabel,
} from "@/lib/pegawai-form-shared"
import { golonganList } from "@/lib/mock-data"

// Normalize golongan string agar cocok dengan golonganList
// Contoh: "Penata Muda (III)" → "Penata Muda (III/a)"
const normalizeGolongan = (golongan: string): string => {
  if (!golongan) return ""
  // Jika sudah ada di list, kembalikan langsung
  if (golonganList.includes(golongan)) return golongan
  // Coba cari match berdasarkan awalan (pangkat + golongan tanpa ruang)
  // Format lama: "Penata Muda (III)" → cocokkan ke "Penata Muda (III/a)"
  const match = golonganList.find((g) => {
    // Strip ruang dari golonganList entry: "Penata Muda (III/a)" → "Penata Muda (III)"
    const withoutRuang = g.replace(/\/[a-e]\)$/, ")")
    return withoutRuang === golongan
  })
  return match ?? golongan
}

export type AddPegawaiFormState = {
  nipPegawai: string
  nama: string
  gelarDepan: string
  gelarBelakang: string
  jabatan: string
  departemen: string
  golongan: string
  status: string
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
  status: "1",
  tanggalMasuk: "",
  email: "",
  noHp: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "1",
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
  tmtPppk: "",
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
  tmtPppk: current?.tmtPppk ?? pegawai.kepegawaian?.tmtPppk ?? "",
  masaKerjaTahun: current?.masaKerjaTahun ?? pegawai.kepegawaian?.masaKerjaTahun ?? 0,
  masaKerjaBulan: current?.masaKerjaBulan ?? pegawai.kepegawaian?.masaKerjaBulan ?? 0,
})

export const normalizePegawaiToEditForm = (pegawai: Pegawai): Partial<Pegawai> => {
  const masaKerja = calculateMasaKerja(pegawai.kepegawaian?.tmtPns ?? pegawai.tanggalMasuk ?? "")

  return {
    ...pegawai,
    golongan: golonganValueFromValueOrLabel(normalizeGolongan(pegawai.golongan ?? "")),
    status: statusInternalValueFromValueOrLabel(pegawai.status ?? ""),
    departemen: departemenValueFromValueOrLabel(pegawai.departemen ?? pegawai.kepegawaian?.jenisPegawai ?? ""),
    agama: agamaValueFromValueOrLabel(pegawai.agama ?? ""),
    jenisKelamin: jenisKelaminValueFromValueOrLabel(pegawai.jenisKelamin ?? ""),
    identitasResmi: ensureIdentitasResmi(pegawai, pegawai.identitasResmi),
    kepegawaian: ensureKepegawaian(pegawai, {
      ...pegawai.kepegawaian,
      statusPegawai: statusKepegawaianValueFromValueOrLabel(pegawai.kepegawaian?.statusPegawai),
      jenisPegawai: jenisPegawaiValueFromValueOrLabel(pegawai.kepegawaian?.jenisPegawai),
      masaKerjaTahun: masaKerja.tahun,
      masaKerjaBulan: masaKerja.bulan,
    }),
  }
}
