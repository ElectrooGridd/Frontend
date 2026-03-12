import { create } from 'zustand'
import { getAuthToken, setAuthToken } from '@/services/api'
import { authService } from '@/services/authService'

type AuthState = {
  accessToken: string | null
  setToken: (token: string | null) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: getAuthToken(),
  setToken: (token) => {
    setAuthToken(token)
    set({ accessToken: token })
  },
  logout: () => {
    authService.logout().finally(() => set({ accessToken: null }))
  },
  hydrate: () => set({ accessToken: getAuthToken() }),
}))
