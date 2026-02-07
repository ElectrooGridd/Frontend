import { api, setAuthToken } from './api'

export type LoginPayload = { email: string; password: string }
export type RegisterPayload = { name: string; email: string; password: string }
export type AuthResponse = { access_token: string; token_type?: string }

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    if (data.access_token) setAuthToken(data.access_token)
    return data
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    if (data.access_token) setAuthToken(data.access_token)
    return data
  },

  logout() {
    setAuthToken(null)
  },
}
