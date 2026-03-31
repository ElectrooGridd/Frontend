import { create } from 'zustand'
import { rechargesService } from '@/services/rechargesService'
import type { RechargeTransaction } from '@/types/api'

const PAGE_SIZE = 20

type RechargesState = {
  recharges: RechargeTransaction[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  offset: number
  hasMore: boolean
  fetch: () => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
}

export const useRechargesStore = create<RechargesState>()((set, get) => ({
  recharges: [],
  loading: false,
  loadingMore: false,
  error: null,
  offset: 0,
  hasMore: true,

  fetch: async () => {
    if (get().loading) return
    if (get().recharges.length > 0 && !get().error) return

    set({ loading: true, error: null })
    try {
      const data = await rechargesService.getMyRecharges({ limit: PAGE_SIZE, offset: 0 })
      set({ recharges: data, loading: false, offset: data.length, hasMore: data.length === PAGE_SIZE })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load recharges', loading: false })
    }
  },

  loadMore: async () => {
    const { loadingMore, hasMore, offset } = get()
    if (loadingMore || !hasMore) return

    set({ loadingMore: true })
    try {
      const data = await rechargesService.getMyRecharges({ limit: PAGE_SIZE, offset })
      set((s) => ({
        recharges: [...s.recharges, ...data],
        loadingMore: false,
        offset: s.offset + data.length,
        hasMore: data.length === PAGE_SIZE,
      }))
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load more', loadingMore: false })
    }
  },

  refresh: async () => {
    set({ loading: true, error: null })
    try {
      const data = await rechargesService.getMyRecharges({ limit: PAGE_SIZE, offset: 0 })
      set({ recharges: data, loading: false, offset: data.length, hasMore: data.length === PAGE_SIZE })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load recharges', loading: false })
    }
  },

  reset: () => set({ recharges: [], loading: false, loadingMore: false, error: null, offset: 0, hasMore: true }),
}))
