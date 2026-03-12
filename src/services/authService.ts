import { api, setAuthToken, setRefreshToken, clearAuth } from './api'

export type LoginPayload = { email: string; password: string }
export type RegisterPayload = { name: string; email: string; password: string }
export type AuthUser = { id: string; username?: string }
export type AuthResponse = {
  access_token: string
  refresh_token: string
  user?: AuthUser
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    if (data.access_token) setAuthToken(data.access_token)
    if (data.refresh_token) setRefreshToken(data.refresh_token)
    return data
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    if (data.access_token) setAuthToken(data.access_token)
    if (data.refresh_token) setRefreshToken(data.refresh_token)
    return data
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken })
    } finally {
      clearAuth()
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
    return data
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, password })
    return data
  },

  async verifyEmailWithToken(token: string): Promise<{ message: string }> {
    const { data } = await api.get<{ message: string }>('/auth/verify-email', {
      params: { token },
    })
    return data
  },

  async requestEmailVerification(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/verify-email', { email })
    return data
  },
}
