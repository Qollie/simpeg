export type AuthUser = {
  id: number
  name: string
  email: string
  foto?: string | null
}

type AuthPayload = {
  token: string
  user: AuthUser
}

const AUTH_KEY = 'simpeg_auth'

export function getAuth(): AuthPayload | null {
  const sessionRaw = sessionStorage.getItem(AUTH_KEY)
  if (sessionRaw) {
    try {
      return JSON.parse(sessionRaw) as AuthPayload
    } catch {
      sessionStorage.removeItem(AUTH_KEY)
      return null
    }
  }

  // Backward compatibility: migrate old persistent auth into session scope.
  const legacyRaw = localStorage.getItem(AUTH_KEY)
  if (!legacyRaw) return null

  try {
    const parsed = JSON.parse(legacyRaw) as AuthPayload
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(parsed))
    localStorage.removeItem(AUTH_KEY)
    return parsed
  } catch {
    localStorage.removeItem(AUTH_KEY)
    return null
  }
}

export function setAuth(payload: AuthPayload) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(payload))
  localStorage.removeItem(AUTH_KEY)
}

export function clearAuth() {
  sessionStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(): boolean {
  const auth = getAuth()
  return Boolean(auth?.token)
}
