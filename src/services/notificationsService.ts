import { api } from './api'

export type Alert = { id: string; title?: string; message?: string; type?: string; created_at?: string }

export const notificationsService = {
  async getAlerts(): Promise<Alert[]> {
    const { data } = await api.get<Alert[] | { alerts?: Alert[] }>('/notifications/alerts')
    return Array.isArray(data) ? data : (data?.alerts ?? [])
  },
}
