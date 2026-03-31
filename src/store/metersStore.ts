import { create } from 'zustand'
import { api } from '@/services/api'
import type { MeterResponse } from '@/types/api'

type MetersState = {
  meters: MeterResponse[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
}

export const useMetersStore = create<MetersState>()((set, get) => ({
  meters: [],
  loading: false,
  error: null,

  fetch: async () => {
    if (get().loading) return
    if (get().meters.length > 0 && !get().error) return

    set({ loading: true, error: null })
    try {
      const { data } = await api.get<MeterResponse[]>('/users/me/meters')
      set({ meters: Array.isArray(data) ? data : [], loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load meters', loading: false })
    }
  },

  refresh: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get<MeterResponse[]>('/users/me/meters')
      set({ meters: Array.isArray(data) ? data : [], loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load meters', loading: false })
    }
  },

  reset: () => set({ meters: [], loading: false, error: null }),
}))
