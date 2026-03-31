import { maximumBirthDateString, todayString } from "@/lib/pegawai-form-shared"
import type { Pegawai } from "@/lib/types"

export const addPegawaiFieldLabels: Record<string, string> = {
  nipPegawai: "NIP",
  nama: "Nama",
  gelarDepan: "Gelar depan",
  gelarBelakang: "Gelar belakang",
  jabatan: "Jabatan",
  departemen: "Departemen",
  golongan: "Golongan",
  status: "Status pegawai internal",
  tanggalMasuk: "Tanggal masuk",
  email: "Email",
  noHp: "No. HP",
  tempatLahir: "Tempat lahir",
  tanggalLahir: "Tanggal lahir",
  jenisKelamin: "Jenis kelamin",
  agama: "Agama",
  alamat: "Alamat",
  nik: "NIK",
  noBpjs: "No. BPJS",
  noNpwp: "No. NPWP",
  karpeg: "Karpeg",
  karsuKarsi: "Karsu/Karsi",
  taspen: "Taspen",
  statusPegawai: "Status pegawai",
  jenisPegawai: "Jenis pegawai",
  tmtCpns: "TMT CPNS",
  tmtPns: "TMT PNS",
  masaKerjaTahun: "Masa kerja (tahun)",
  masaKerjaBulan: "Masa kerja (bulan)",
}

export const editPegawaiFieldLabels: Record<string, string> = {
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

export const addPegawaiMaxLengthRules: Record<string, number> = {
  nipPegawai: 18,
  nama: 150,
  gelarDepan: 50,
  gelarBelakang: 50,
  jabatan: 150,
  departemen: 150,
  golongan: 100,
  status: 20,
  email: 120,
  noHp: 20,
  tempatLahir: 100,
  jenisKelamin: 10,
  agama: 20,
  nik: 16,
  noBpjs: 20,
  noNpwp: 25,
  karpeg: 30,
  karsuKarsi: 30,
  taspen: 30,
  statusPegawai: 20,
  jenisPegawai: 50,
}

export const editPegawaiMaxLengthRules: Record<string, number> = {
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

export const applyMaxLengthValidation = (
  errors: Record<string, string>,
  getValue: (path: string) => string,
  maxLengthRules: Record<string, number>,
  fieldLabels: Record<string, string>
) => {
  Object.entries(maxLengthRules).forEach(([path, maxLength]) => {
    const value = getValue(path).trim()
    if (!value) return
    if (value.length > maxLength) {
      errors[path] = `${fieldLabels[path] ?? path} maksimal ${maxLength} karakter.`
    }
  })
}

export const applyEmailValidation = (errors: Record<string, string>, key: string, email: string) => {
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors[key] = "Format email tidak valid."
  }
}

export const applyNikValidation = (errors: Record<string, string>, key: string, nik: string) => {
  if (nik && !/^\d{16}$/.test(nik)) {
    errors[key] = "NIK harus terdiri dari 16 digit."
  }
}

export const applyDateNotAfterTodayValidation = (
  errors: Record<string, string>,
  key: string,
  label: string,
  value: string
) => {
  if (value && value > todayString) {
    errors[key] = `${label} tidak boleh melebihi tanggal hari ini.`
  }
}

export const applyBirthDateValidation = (errors: Record<string, string>, key: string, value: string) => {
  if (!value) return
  if (value > todayString) {
    errors[key] = "Tanggal lahir tidak boleh melebihi tanggal hari ini."
  } else if (value > maximumBirthDateString) {
    errors[key] = "Tanggal lahir harus menunjukkan usia minimal 17 tahun."
  }
}

export const applyMasaKerjaValidation = (
  errors: Record<string, string>,
  tahunKey: string,
  bulanKey: string,
  tahun: number,
  bulan: number
) => {
  if (!Number.isInteger(tahun) || tahun < 0) {
    errors[tahunKey] = "Masa kerja tahun harus bilangan bulat 0 atau lebih."
  }

  if (!Number.isInteger(bulan) || bulan < 0 || bulan > 11) {
    errors[bulanKey] = "Masa kerja bulan harus antara 0 sampai 11."
  }
}

type DuplicateCheckInput = {
  nipPegawai?: string
  email?: string
  nik?: string
  noBpjs?: string
  noNpwp?: string
  karpeg?: string
  karsuKarsi?: string
  taspen?: string
}

type DuplicateCheckOptions = {
  includeNip?: boolean
  excludeNipPegawai?: string
}

export const duplicateFieldMap = {
  NIP: "nipPegawai",
  Email: "email",
  NIK: "nik",
  "No. BPJS": "noBpjs",
  "No. NPWP": "noNpwp",
  Karpeg: "karpeg",
  "Karsu/Karsi": "karsuKarsi",
  Taspen: "taspen",
} as const

export const findPegawaiDuplicates = (
  existingPegawai: Pegawai[],
  input: DuplicateCheckInput,
  options: DuplicateCheckOptions = {}
) => {
  const duplicates: string[] = []
  const normalizedEmail = input.email?.trim().toLowerCase()

  existingPegawai
    .filter((pegawai) => pegawai.nipPegawai !== options.excludeNipPegawai)
    .forEach((pegawai) => {
      const ident = pegawai.identitasResmi
      if (options.includeNip && input.nipPegawai && pegawai.nipPegawai === input.nipPegawai) duplicates.push("NIP")
      if (normalizedEmail && pegawai.email && pegawai.email.toLowerCase() === normalizedEmail) duplicates.push("Email")
      if (!ident) return
      if (input.nik && ident.nik === input.nik) duplicates.push("NIK")
      if (input.noBpjs && ident.noBpjs === input.noBpjs) duplicates.push("No. BPJS")
      if (input.noNpwp && ident.noNpwp === input.noNpwp) duplicates.push("No. NPWP")
      if (input.karpeg && ident.karpeg === input.karpeg) duplicates.push("Karpeg")
      if (input.karsuKarsi && ident.karsuKarsi === input.karsuKarsi) duplicates.push("Karsu/Karsi")
      if (input.taspen && ident.taspen === input.taspen) duplicates.push("Taspen")
    })

  return Array.from(new Set(duplicates))
}

export const buildDuplicateErrors = (
  duplicates: string[],
  keyPrefixMap: Partial<Record<(typeof duplicateFieldMap)[keyof typeof duplicateFieldMap], string>> = {}
) => {
  return duplicates.reduce<Record<string, string>>((acc, label) => {
    const baseKey = duplicateFieldMap[label as keyof typeof duplicateFieldMap]
    if (!baseKey) return acc

    const prefix = keyPrefixMap[baseKey]
    const finalKey = prefix ? `${prefix}.${baseKey}` : baseKey
    acc[finalKey] = `${label} sudah digunakan.`
    return acc
  }, {})
}

const identitasResmiKeys = ["nik", "noBpjs", "noNpwp", "karpeg", "karsuKarsi", "taspen"]
const kepegawaianKeys = ["statusPegawai", "jenisPegawai", "tmtCpns", "tmtPns", "masaKerjaTahun", "masaKerjaBulan"]

export const normalizePegawaiFieldErrors = (
  fieldErrors: Record<string, unknown>,
  mode: "flat" | "nested" = "nested"
) => {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, value]) => {
      if (mode === "flat") {
        return [key, String(value)]
      }

      const normalizedKey = identitasResmiKeys.includes(key)
        ? `identitasResmi.${key}`
        : kepegawaianKeys.includes(key)
          ? `kepegawaian.${key}`
          : key

      return [normalizedKey, String(value)]
    })
  )
}
