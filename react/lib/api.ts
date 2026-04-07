import { clearAuth, getAuth } from './auth'

const apiBase =
  ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return `${apiBase}${path}`
  return `${apiBase}/${path}`
}

// ─── In-memory GET cache (stale-while-revalidate) ────────────────────────────
const CACHE_TTL    = 45_000   // data segar selama 45 detik
const STALE_TTL    = 120_000  // data basi tapi masih bisa ditampilkan sampai 2 menit
const STORAGE_KEY  = 'simpeg_api_cache'

type CacheEntry = { json: unknown; ts: number }
const responseCache = new Map<string, CacheEntry>()

// Muat cache dari sessionStorage saat modul pertama kali diload
// → data tetap ada walau halaman di-refresh
;(function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const stored: Record<string, CacheEntry> = JSON.parse(raw)
    const now = Date.now()
    for (const [url, entry] of Object.entries(stored)) {
      if (now - entry.ts < STALE_TTL) {
        responseCache.set(url, entry)
      }
    }
  } catch {
    // sessionStorage mungkin tidak tersedia atau data rusak — abaikan
  }
})()

function persistToStorage(): void {
  try {
    const obj: Record<string, CacheEntry> = {}
    for (const [url, entry] of responseCache.entries()) {
      obj[url] = entry
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch {
    // sessionStorage penuh atau tidak tersedia — abaikan
  }
}

function setCacheEntry(url: string, entry: CacheEntry): void {
  responseCache.set(url, entry)
  persistToStorage()
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Panaskan cache untuk URL tertentu secara background (fire-and-forget).
 * Cocok dipanggil saat hover nav link atau saat login berhasil.
 */
export function prefetchUrl(path: string): void {
  const url = buildUrl(path)
  const cached = responseCache.get(url)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return  // sudah segar

  const headers = new Headers()
  headers.set('Accept', 'application/json')
  const token = getAuth()?.token
  if (token) headers.set('Authorization', `Bearer ${token}`)

  fetch(url, { headers }).then((r) => {
    if (r.ok) {
      r.json().then((data) => {
        setCacheEntry(url, { json: data, ts: Date.now() })
      }).catch(() => {})
    }
  }).catch(() => {})
}

/**
 * Hapus cache berdasarkan fragment URL, lalu sinkronkan ke sessionStorage.
 * Panggil setelah operasi mutasi (add/edit/delete).
 */
export function invalidateApiCache(urlFragment?: string): void {
  if (!urlFragment) {
    responseCache.clear()
    sessionStorage.removeItem(STORAGE_KEY)
    return
  }
  for (const key of responseCache.keys()) {
    if (key.includes(urlFragment)) responseCache.delete(key)
  }
  persistToStorage()
}

// ─── Core fetch ───────────────────────────────────────────────────────────────
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = buildUrl(input)
  const method = (init.method ?? 'GET').toUpperCase()

  const headers = new Headers(init.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')

  const token = getAuth()?.token
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // ── GET: cek cache ──────────────────────────────────────────────────────────
  if (method === 'GET') {
    const cached = responseCache.get(url)
    const age    = cached ? Date.now() - cached.ts : Infinity

    if (cached && age < STALE_TTL) {
      if (age < CACHE_TTL) {
        // Masih segar → kembalikan langsung tanpa ke server
        return new Response(JSON.stringify(cached.json), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      // Basi tapi masih dalam STALE_TTL → kembalikan seketika + refresh di background
      doFetch(url, init, headers)
      return new Response(JSON.stringify(cached.json), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  return doFetch(url, init, headers)
}

async function doFetch(url: string, init: RequestInit, headers: Headers): Promise<Response> {
  const response = await fetch(url, { ...init, headers })

  if (response.status === 401 || response.status === 419) {
    clearAuth()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new Error('Sesi berakhir, silakan login kembali.')
  }

  // Cache response GET yang berhasil + simpan ke sessionStorage
  if ((init.method ?? 'GET').toUpperCase() === 'GET' && response.ok) {
    response.clone().json().then((data) => {
      setCacheEntry(url, { json: data, ts: Date.now() })
    }).catch(() => {})
  }

  return response
}
