import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateWorkDuration(startDate: string): string {
  if (!startDate) return "-"
  const start = new Date(startDate)
  const now = new Date()
  
  if (isNaN(start.getTime())) return "-"

  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  
  if (months < 0) {
    years--
    months += 12
  }
  
  if (years > 0) {
    return `${years} Thn ${months > 0 ? `${months} Bln` : ""}`
  }
  return months > 0 ? `${months} Bln` : "< 1 Bln"
}
