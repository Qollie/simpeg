export const agamaList = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"]
export const jenisKelaminList = ["Laki-laki", "Perempuan"]
export const statusKepegawaianList = ["PNS", "PPPK", "Non-ASN"]
export const jenisPegawaiList = ["Tenaga Struktural", "Tenaga Fungsional", "Tenaga Administrasi"]

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
