export const agamaList = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"]
export const jenisKelaminList = ["Laki-laki", "Perempuan"]

export const agamaOptions = [
  { value: "1", label: "Islam" },
  { value: "2", label: "Kristen" },
  { value: "3", label: "Katolik" },
  { value: "4", label: "Hindu" },
  { value: "5", label: "Buddha" },
  { value: "6", label: "Konghucu" },
  { value: "7", label: "Lainnya" },
] as const

export const jenisKelaminOptions = [
  { value: "1", label: "Laki-laki" },
  { value: "2", label: "Perempuan" },
] as const

export const golonganOptions = [
  { value: "1",  label: "Juru Muda (I/a)" },
  { value: "2",  label: "Juru Muda Tingkat I (I/b)" },
  { value: "3",  label: "Juru (I/c)" },
  { value: "4",  label: "Juru Tingkat I (I/d)" },
  { value: "5",  label: "Pengatur Muda (II/a)" },
  { value: "6",  label: "Pengatur Muda Tingkat I (II/b)" },
  { value: "7",  label: "Pengatur (II/c)" },
  { value: "8",  label: "Pengatur Tingkat I (II/d)" },
  { value: "9",  label: "Penata Muda (III/a)" },
  { value: "10", label: "Penata Muda Tingkat I (III/b)" },
  { value: "11", label: "Penata (III/c)" },
  { value: "12", label: "Penata Tingkat I (III/d)" },
  { value: "13", label: "Pembina (IV/a)" },
  { value: "14", label: "Pembina Tingkat I (IV/b)" },
  { value: "15", label: "Pembina Utama Muda (IV/c)" },
  { value: "16", label: "Pembina Utama Madya (IV/d)" },
  { value: "17", label: "Pembina Utama (IV/e)" },
] as const

const makeHelpers = <T extends readonly { value: string; label: string }[]>(options: T) => ({
  labelFromValue: (value?: string): string => {
    if (!value) return ""
    return options.find((o) => o.value === value)?.label
      ?? options.find((o) => o.label === value)?.label
      ?? value
  },
  valueFromValueOrLabel: (value?: string): string => {
    if (!value) return ""
    return options.find((o) => o.value === value)?.value
      ?? options.find((o) => o.label === value)?.value
      ?? value
  },
})

const agamaHelpers        = makeHelpers(agamaOptions)
const jenisKelaminHelpers = makeHelpers(jenisKelaminOptions)
const golonganHelpers     = makeHelpers(golonganOptions)

export const agamaLabelFromValue              = agamaHelpers.labelFromValue
export const agamaValueFromValueOrLabel       = agamaHelpers.valueFromValueOrLabel
export const jenisKelaminLabelFromValue       = jenisKelaminHelpers.labelFromValue
export const jenisKelaminValueFromValueOrLabel = jenisKelaminHelpers.valueFromValueOrLabel
export const golonganLabelFromValue           = golonganHelpers.labelFromValue
export const golonganValueFromValueOrLabel    = golonganHelpers.valueFromValueOrLabel

export const departemenOptions = [
  { value: "1", label: "Kepala Dinas" },
  { value: "2", label: "Pelayanan Pendaftaran Penduduk" },
  { value: "3", label: "Pelayanan Pencatatan Sipil" },
  { value: "4", label: "Pengelolaan Informasi Administrasi Kependudukan" },
  { value: "5", label: "Pemanfaatan Data dan Inovasi Pelayanan" },
  { value: "6", label: "Kasubag Umum dan Kepegawaian" },
  { value: "7", label: "Kasubag. Keuangan" },
] as const

export const departemenLabelFromValue = (value?: string): string => {
  if (!value) return ""
  const byValue = departemenOptions.find((item) => item.value === value)
  if (byValue) return byValue.label
  const byLabel = departemenOptions.find((item) => item.label === value)
  return byLabel?.label ?? value
}

export const departemenValueFromValueOrLabel = (value?: string): string => {
  if (!value) return ""
  const byValue = departemenOptions.find((item) => item.value === value)
  if (byValue) return byValue.value
  const byLabel = departemenOptions.find((item) => item.label === value)
  return byLabel?.value ?? value
}

export const statusInternalOptions = [
  { value: "1", label: "Aktif" },
  { value: "2", label: "Cuti" },
  { value: "3", label: "Pensiun" },
] as const

export const statusInternalLabelFromValue = (value?: string): string => {
  if (!value) return "Aktif"
  const byValue = statusInternalOptions.find((item) => item.value === value)
  if (byValue) return byValue.label
  const byLabel = statusInternalOptions.find((item) => item.label === value)
  return byLabel?.label ?? value
}

export const statusInternalValueFromValueOrLabel = (value?: string): string => {
  if (!value) return "1"
  const byValue = statusInternalOptions.find((item) => item.value === value)
  if (byValue) return byValue.value
  const byLabel = statusInternalOptions.find((item) => item.label === value)
  return byLabel?.value ?? value
}

export const statusKepegawaianOptions = [
  { value: "1", label: "PNS" },
  { value: "2", label: "PPPK" },
  { value: "3", label: "Non-ASN" },
] as const

export const jenisPegawaiOptions = [
  { value: "1", label: "Tenaga Struktural" },
  { value: "2", label: "Tenaga Fungsional" },
  { value: "3", label: "Tenaga Administrasi" },
] as const

export const statusKepegawaianList = statusKepegawaianOptions.map((item) => item.label)
export const jenisPegawaiList = jenisPegawaiOptions.map((item) => item.label)

export const statusKepegawaianLabelFromValue = (value?: string) => {
  if (!value) return ""
  const byValue = statusKepegawaianOptions.find((item) => item.value === value)
  if (byValue) return byValue.label
  const byLabel = statusKepegawaianOptions.find((item) => item.label === value)
  return byLabel?.label ?? value
}

export const statusKepegawaianValueFromValueOrLabel = (value?: string) => {
  if (!value) return ""
  const byValue = statusKepegawaianOptions.find((item) => item.value === value)
  if (byValue) return byValue.value
  const byLabel = statusKepegawaianOptions.find((item) => item.label === value)
  return byLabel?.value ?? value
}

export const jenisPegawaiLabelFromValue = (value?: string) => {
  if (!value) return ""
  const byValue = jenisPegawaiOptions.find((item) => item.value === value)
  if (byValue) return byValue.label
  const byLabel = jenisPegawaiOptions.find((item) => item.label === value)
  return byLabel?.label ?? value
}

export const jenisPegawaiValueFromValueOrLabel = (value?: string) => {
  if (!value) return ""
  const byValue = jenisPegawaiOptions.find((item) => item.value === value)
  if (byValue) return byValue.value
  const byLabel = jenisPegawaiOptions.find((item) => item.label === value)
  return byLabel?.value ?? value
}

export const MAX_FOTO_SIZE_BYTES = 5 * 1024 * 1024

const today = new Date()
export const todayString = today.toISOString().split("T")[0]

const minimumBirthDate = new Date(today)
minimumBirthDate.setFullYear(minimumBirthDate.getFullYear() - 17)
export const maximumBirthDateString = minimumBirthDate.toISOString().split("T")[0]

export const calculateMasaKerja = (dateString?: string) => {
  if (!dateString) {
    return { tahun: 0, bulan: 0 }
  }

  const [year, month, day] = dateString.split("-").map(Number)
  if (!year || !month || !day) {
    return { tahun: 0, bulan: 0 }
  }

  const startDate = new Date(year, month - 1, day)
  if (Number.isNaN(startDate.getTime()) || startDate > today) {
    return { tahun: 0, bulan: 0 }
  }

  let tahun = today.getFullYear() - startDate.getFullYear()
  let bulan = today.getMonth() - startDate.getMonth()

  if (today.getDate() < startDate.getDate()) {
    bulan -= 1
  }

  if (bulan < 0) {
    tahun -= 1
    bulan += 12
  }

  return {
    tahun: Math.max(tahun, 0),
    bulan: Math.max(bulan, 0),
  }
}
