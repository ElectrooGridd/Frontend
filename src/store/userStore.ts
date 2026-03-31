import { create } from 'zustand'
import { userService } from '@/services/userService'
import type { User } from '@/types/api'

type UserState = {
  user: User | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  reset: () => void
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  loading: false,
  error: null,

  fetch: async () => {
    // Skip if already loading or already have data
    if (get().loading) return
    if (get().user && !get().error) return

    set({ loading: true, error: null })
    try {
      const user = await userService.getMe()
      set({ user, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load user', loading: false })
    }
  },

  reset: () => set({ user: null, loading: false, error: null }),
}))
