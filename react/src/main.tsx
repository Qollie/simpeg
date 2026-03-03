import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Menggunakan alias @ untuk mengakses folder app di root
import '../app/globals.css' 
import { clearAuth, getAuth } from '@/lib/auth'

const originalFetch = window.fetch.bind(window)

const redirectToLogin = () => {
  clearAuth()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url

  const isApiRequest = url.startsWith('/api') || url.includes('/api/')
  const isLoginRequest = url.includes('/api/auth/login')

  if (!isApiRequest || isLoginRequest) {
    return originalFetch(input, init)
  }

  const auth = getAuth()
  const token = auth?.token

  if (!token) {
    redirectToLogin()
    return originalFetch(input, init)
  }

  const headers = new Headers(init?.headers)
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return originalFetch(input, {
    ...init,
    headers,
  }).then((response) => {
    if (response.status === 401 || response.status === 419) {
      redirectToLogin()
    }
    return response
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
