import axios, { type AxiosError } from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const BASE_URL = `${API_BASE}/api/v1`

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // #6 — send httpOnly refresh-token cookie automatically
  timeout: 15000,
})

// ---------------------------------------------------------------------------
// Access token lives in memory only — never touches localStorage (#6)
// ---------------------------------------------------------------------------
let accessToken: string | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
  scheduleProactiveRefresh(token) // #7
}

export function getAccessToken(): string | null {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

// ---------------------------------------------------------------------------
// #7 — Proactive refresh: schedule a silent refresh ~1 min before expiry
// ---------------------------------------------------------------------------
function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return typeof decoded.exp === 'number' ? decoded.exp : null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  const exp = decodeJwtExp(token)
  if (!exp) return true
  return Date.now() >= exp * 1000
}

function scheduleProactiveRefresh(token: string | null) {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  if (!token) return

  const exp = decodeJwtExp(token)
  if (!exp) return

  // Refresh 60 seconds before expiry (or immediately if less than 60s left)
  const msUntilExpiry = exp * 1000 - Date.now()
  const refreshIn = Math.max(msUntilExpiry - 60_000, 0)

  refreshTimer = setTimeout(async () => {
    try {
      const { data } = await axios.post<{ access_token: string }>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      setAccessToken(data.access_token)
    } catch {
      // Refresh failed — the next API call will trigger the 401 interceptor
    }
  }, refreshIn)
}

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------

// Attach access token from memory to every request
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// 401 handling — attempt one silent refresh, then give up
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = []

function processQueue(token: string | null, err: Error | null) {
  failedQueue.forEach((p) => (err ? p.reject(err) : token ? p.resolve(token) : p.reject(new Error('No token'))))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => {
    // Backend wraps successful responses in { data: ... } — unwrap so callers
    // get the payload directly from `response.data` instead of `response.data.data`.
    if (res.data && typeof res.data === 'object' && 'data' in res.data && Object.keys(res.data).length === 1) {
      res.data = res.data.data
    }
    return res
  },
  async (err: AxiosError<{ message?: string; error?: string }>) => {
    const original = err.config
    if (!original || err.response?.status !== 401) {
      const message = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? 'Request failed'
      return Promise.reject(new Error(message))
    }

    // If already refreshing, queue this request
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
      // Cookie is sent automatically via withCredentials
      const { data } = await axios.post<{ access_token: string }>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      setAccessToken(data.access_token)
      processQueue(data.access_token, null)
      original.headers.Authorization = `Bearer ${data.access_token}`
      return api(original)
    } catch (refreshErr) {
      processQueue(null, refreshErr instanceof Error ? refreshErr : new Error('Refresh failed'))
      clearAccessToken()
      window.location.href = '/'
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  },
)

// ---------------------------------------------------------------------------
// tryRestoreSession — called once on app boot to silently exchange the
// httpOnly refresh-token cookie for a fresh access token. (#8 on reload)
// ---------------------------------------------------------------------------
export async function tryRestoreSession(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ access_token: string }>(
      `${BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, timeout: 5000 },
    )
    setAccessToken(data.access_token)
    return data.access_token
  } catch {
    clearAccessToken()
    return null
  }
}
