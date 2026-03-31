export const agamaList = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"]
export const jenisKelaminList = ["Laki-laki", "Perempuan"]
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
