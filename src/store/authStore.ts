import { create } from 'zustand'
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  isTokenExpired,
  tryRestoreSession,
} from '@/services/api'
import { authService } from '@/services/authService'

// ---------------------------------------------------------------------------
// #10 — Cross-tab logout via BroadcastChannel
// ---------------------------------------------------------------------------
const AUTH_CHANNEL = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('electrogrid_auth') : null

type AuthState = {
  accessToken: string | null
  /** True while the initial session-restore is in flight */
  isRestoring: boolean
  setToken: (token: string | null) => void
  logout: () => void
  /** Called once on app boot to restore session from the httpOnly cookie */
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: getAccessToken(), // null on fresh load (memory-only)
  isRestoring: true, // optimistic — resolved in restoreSession()

  setToken: (token) => {
    setAccessToken(token)
    set({ accessToken: token })
  },

  logout: () => {
    authService.logout().finally(() => {
      clearAccessToken()
      set({ accessToken: null })
      // #10 — Notify other tabs to log out
      AUTH_CHANNEL?.postMessage('logout')
    })
  },

  restoreSession: async () => {
    set({ isRestoring: true })
    const token = await tryRestoreSession()
    set({ accessToken: token, isRestoring: false })
  },
}))

// ---------------------------------------------------------------------------
// #10 — Listen for logout broadcasts from other tabs
// ---------------------------------------------------------------------------
AUTH_CHANNEL?.addEventListener('message', (event) => {
  if (event.data === 'logout') {
    clearAccessToken()
    useAuthStore.setState({ accessToken: null })
    window.location.href = '/'
  }
})

// ---------------------------------------------------------------------------
// #8 — Stale-tab revalidation: when tab becomes visible, check token
// ---------------------------------------------------------------------------
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return

    const token = getAccessToken()
    if (!token) return // not logged in, nothing to do

    if (isTokenExpired(token)) {
      // Token expired while tab was hidden — attempt silent refresh
      const freshToken = await tryRestoreSession()
      useAuthStore.setState({ accessToken: freshToken })
      if (!freshToken) {
        // Refresh failed — session is dead
        window.location.href = '/'
      }
    }
  })
}
