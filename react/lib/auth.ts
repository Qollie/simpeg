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
  const localRaw = localStorage.getItem(AUTH_KEY)
  if (localRaw) {
    try {
      return JSON.parse(localRaw) as AuthPayload
    } catch {
      localStorage.removeItem(AUTH_KEY)
      return null
    }
  }

  // Backward compatibility: migrate auth from old session scope into local scope.
  const sessionRaw = sessionStorage.getItem(AUTH_KEY)
  if (!sessionRaw) return null

  try {
    const parsed = JSON.parse(sessionRaw) as AuthPayload
    localStorage.setItem(AUTH_KEY, JSON.stringify(parsed))
    sessionStorage.removeItem(AUTH_KEY)
    return parsed
  } catch {
    sessionStorage.removeItem(AUTH_KEY)
    return null
  }
}

export function setAuth(payload: AuthPayload) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
  sessionStorage.removeItem(AUTH_KEY)
}

export function clearAuth() {
  sessionStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(): boolean {
  const auth = getAuth()
  return Boolean(auth?.token)
}
