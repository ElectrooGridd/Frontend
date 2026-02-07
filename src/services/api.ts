import axios, { type AxiosError } from 'axios'

const BASE_URL = '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ message?: string; error?: string }>) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/welcome'
    }
    const message = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('access_token', token)
  else localStorage.removeItem('access_token')
}

export function getAuthToken(): string | null {
  return localStorage.getItem('access_token')
}
