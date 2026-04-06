const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const BASE_URL = `${API_BASE}/api/v1`

const REFRESH_TOKEN_KEY = 'eg_rt'

// ---------------------------------------------------------------------------
// Token storage — access token in memory, refresh token in sessionStorage
// so it survives page refreshes but is cleared when the tab closes.
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

function setRefreshToken(token: string | null) {
  if (token) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

/** Store both tokens from a login/register/refresh response. */
export function setTokens(accessTk: string | null, refreshTk?: string | null) {
  setAccessToken(accessTk)
  if (refreshTk !== undefined) setRefreshToken(refreshTk)
}

export function clearAccessToken() {
  accessToken = null
  setRefreshToken(null)
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
      const result = await callRefresh()
      if (result) {
        setTokens(result.access_token, result.refresh_token)
      }
    } catch {
      // Refresh failed — the next API call will trigger the 401 handler
    }
  }, refreshIn)
}

// ---------------------------------------------------------------------------
// Shared refresh helper — sends refresh token via body + cookie (belt & suspenders)
// ---------------------------------------------------------------------------
async function callRefresh(timeout = 5000): Promise<{ access_token: string; refresh_token?: string } | null> {
  const rt = getRefreshToken()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // still send cookie when available
      body: JSON.stringify(rt ? { refresh_token: rt } : {}),
      signal: controller.signal,
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Fetch wrapper that mirrors the axios-style { data } response interface
// ---------------------------------------------------------------------------

class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type RequestOptions = {
  params?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  if (!params) return url
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) search.set(k, String(v))
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

// ---------------------------------------------------------------------------
// 401 handling — attempt one silent refresh, then give up
// ---------------------------------------------------------------------------
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = []

function processQueue(token: string | null, err: Error | null) {
  failedQueue.forEach((p) => (err ? p.reject(err) : token ? p.resolve(token) : p.reject(new Error('No token'))))
  failedQueue = []
}

async function handleUnauthorized<T>(method: string, path: string, body?: unknown, opts?: RequestOptions): Promise<{ data: T }> {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    }).then((token) => {
      return request<T>(method, path, body, opts, token)
    })
  }

  isRefreshing = true
  try {
    const result = await callRefresh(15000)
    if (!result?.access_token) throw new Error('Refresh failed')
    setTokens(result.access_token, result.refresh_token)
    processQueue(result.access_token, null)
    return request<T>(method, path, body, opts, result.access_token)
  } catch (refreshErr) {
    processQueue(null, refreshErr instanceof Error ? refreshErr : new Error('Refresh failed'))
    clearAccessToken()
    window.location.href = '/'
    throw refreshErr
  } finally {
    isRefreshing = false
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: RequestOptions,
  tokenOverride?: string,
): Promise<{ data: T }> {
  const url = buildUrl(path, opts?.params)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts?.headers,
  }

  const token = tokenOverride ?? accessToken
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw err
  }
  clearTimeout(timeout)

  // Don't attempt token refresh for auth endpoints — a 401 on /auth/login
  // means invalid credentials, not an expired token.
  const isAuthEndpoint = path.startsWith('/auth/')
  if (res.status === 401 && !tokenOverride && !isAuthEndpoint) {
    return handleUnauthorized<T>(method, path, body, opts)
  }

  if (!res.ok) {
    let errData: Record<string, unknown> = {}
    try {
      errData = await res.json()
    } catch { /* empty body */ }
    const message = (errData.message ?? errData.error ?? `Request failed with status ${res.status}`) as string
    throw new ApiError(message, res.status, errData)
  }

  // Handle empty responses (204, etc.)
  const text = await res.text()
  if (!text) return { data: undefined as T }

  let data = JSON.parse(text)

  // Backend wraps successful responses in { data: ... } — unwrap so callers
  // get the payload directly from `response.data` instead of `response.data.data`.
  if (data && typeof data === 'object' && 'data' in data && Object.keys(data).length === 1) {
    data = data.data
  }

  return { data: data as T }
}

// ---------------------------------------------------------------------------
// Public API — drop-in replacement for axios instance methods
// ---------------------------------------------------------------------------
export const api = {
  get<T = unknown>(path: string, opts?: RequestOptions): Promise<{ data: T }> {
    return request<T>('GET', path, undefined, opts)
  },
  post<T = unknown>(path: string, body?: unknown, opts?: RequestOptions): Promise<{ data: T }> {
    return request<T>('POST', path, body, opts)
  },
  put<T = unknown>(path: string, body?: unknown, opts?: RequestOptions): Promise<{ data: T }> {
    return request<T>('PUT', path, body, opts)
  },
  patch<T = unknown>(path: string, body?: unknown, opts?: RequestOptions): Promise<{ data: T }> {
    return request<T>('PATCH', path, body, opts)
  },
  delete<T = unknown>(path: string, opts?: RequestOptions): Promise<{ data: T }> {
    return request<T>('DELETE', path, undefined, opts)
  },
}

// ---------------------------------------------------------------------------
// tryRestoreSession — called once on app boot to silently exchange the
// refresh token for a fresh access token. (#8 on reload)
// ---------------------------------------------------------------------------
export async function tryRestoreSession(): Promise<string | null> {
  try {
    const result = await callRefresh()
    if (!result?.access_token) {
      clearAccessToken()
      return null
    }
    setTokens(result.access_token, result.refresh_token)
    return result.access_token
  } catch {
    clearAccessToken()
    return null
  }
}
