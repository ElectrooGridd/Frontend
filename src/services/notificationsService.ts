import { api } from './api'
import type { Alert, Notification } from '@/types/api'

export type { Notification, Alert } from '@/types/api'

export const notificationsService = {
  /** GET /notifications — returns notification list */
  async getNotifications(params?: { limit?: number; offset?: number }): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>('/notifications', { params })
    return Array.isArray(data) ? data : []
  },

  /** Convenience: fetch notifications and map to Alert shape for dashboard */
  async getAlerts(params?: { limit?: number; offset?: number }): Promise<Alert[]> {
    const notifications = await this.getNotifications(params)
    return notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      read: n.read,
      type: 'info',
      created_at: n.created_at,
    }))
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<{ unread_count: number }>('/notifications/unread-count')
    return data.unread_count ?? 0
  },

  async markAsRead(id: string): Promise<void> {
    await api.put(`/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all')
  },
}
