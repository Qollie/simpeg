import { clearAuth, getAuth } from './auth'

const apiBase =
  ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return `${apiBase}${path}`
  return `${apiBase}/${path}`
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = buildUrl(input)
  const headers = new Headers(init.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const token = getAuth()?.token
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, { ...init, headers })

  if (response.status === 401 || response.status === 419) {
    clearAuth()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new Error('Sesi berakhir, silakan login kembali.')
  }

  return response
}
