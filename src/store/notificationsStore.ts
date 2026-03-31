import { create } from 'zustand'
import { notificationsService } from '@/services/notificationsService'
import type { Alert } from '@/types/api'

type NotificationsState = {
  alerts: Alert[]
  unreadCount: number
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  reset: () => void
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  alerts: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetch: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const alerts = await notificationsService.getAlerts({ limit: 20 })
      set({ alerts, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load notifications', loading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await notificationsService.getUnreadCount()
      set({ unreadCount })
    } catch {
      // Silent — badge count is non-critical
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationsService.markAsRead(id)
      set((s) => ({
        alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }))
    } catch {
      // Silent
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsService.markAllAsRead()
      set((s) => ({
        alerts: s.alerts.map((a) => ({ ...a, read: true })),
        unreadCount: 0,
      }))
    } catch {
      // Silent
    }
  },

  reset: () => set({ alerts: [], unreadCount: 0, loading: false, error: null }),
}))
