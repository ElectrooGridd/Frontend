import axios, { type AxiosError } from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://electrogrid-backend-dev.up.railway.app'
const BASE_URL = `${API_BASE}/api/v1`

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = []

function processQueue(token: string | null, err: Error | null) {
  failedQueue.forEach((p) => (err ? p.reject(err) : token ? p.resolve(token) : p.reject(new Error('No token'))))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<{ message?: string; error?: string }>) => {
    const original = err.config
    if (!original || err.response?.status !== 401) {
      const message = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? 'Request failed'
      return Promise.reject(new Error(message))
    }

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      clearAuth()
      window.location.href = '/'
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    isRefreshing = true
    try {
      const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
        `${BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken }
      )
      setAuthToken(data.access_token)
      setRefreshToken(data.refresh_token)
      processQueue(data.access_token, null)
      original.headers.Authorization = `Bearer ${data.access_token}`
      return api(original)
    } catch (refreshErr) {
      processQueue(null, refreshErr instanceof Error ? refreshErr : new Error('Refresh failed'))
      clearAuth()
      window.location.href = '/'
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('access_token', token)
  else localStorage.removeItem('access_token')
}

export function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem('refresh_token', token)
  else localStorage.removeItem('refresh_token')
}

export function getAuthToken(): string | null {
  return localStorage.getItem('access_token')
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token')
}

export function clearAuth() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
