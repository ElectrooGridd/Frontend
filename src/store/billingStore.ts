import { create } from 'zustand'
import { billingService } from '@/services/billingService'
import type { Balance } from '@/types/api'

type BillingState = {
  balance: Balance | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  /** Force re-fetch even if data exists (e.g. after a recharge) */
  refresh: () => Promise<void>
  reset: () => void
}

export const useBillingStore = create<BillingState>()((set, get) => ({
  balance: null,
  loading: false,
  error: null,

  fetch: async () => {
    if (get().loading) return
    if (get().balance && !get().error) return

    set({ loading: true, error: null })
    try {
      const balance = await billingService.getBalance()
      set({ balance, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load balance', loading: false })
    }
  },

  refresh: async () => {
    set({ loading: true, error: null })
    try {
      const balance = await billingService.getBalance()
      set({ balance, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load balance', loading: false })
    }
  },

  reset: () => set({ balance: null, loading: false, error: null }),
}))
