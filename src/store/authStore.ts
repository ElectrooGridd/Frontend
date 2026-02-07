import { create } from 'zustand'
import { getAuthToken, setAuthToken } from '@/services/api'

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
    setAuthToken(null)
    set({ accessToken: null })
  },
  hydrate: () => set({ accessToken: getAuthToken() }),
}))
