import { api } from './api'

/** GET /api/v1/users/me/usage — UsageReadingResponse from Swagger */
export type UsageReading = {
  id: number
  meter_id: string
  consumption_kwh: string
  reading_time: string
}

export type UsageResponse = {
  data: Array<{ name: string; value: number }>
  usage?: UsageReading[]
}

export const energyService = {
  async getUsage(_period?: 'daily' | 'weekly' | 'monthly'): Promise<UsageResponse> {
    const { data } = await api.get<UsageReading[]>('/users/me/usage')
    const readings = Array.isArray(data) ? data : []
    const chartData = readings.map((r) => ({
      name: r.reading_time ? new Date(r.reading_time).toLocaleDateString() : '',
      value: parseFloat(r.consumption_kwh || '0') || 0,
    }))
    return { data: chartData, usage: readings }
  },

  async getUsageByMeter(meterId: string): Promise<UsageResponse> {
    const { data } = await api.get<UsageReading[]>(`/users/me/usage/${meterId}`)
    const readings = Array.isArray(data) ? data : []
    const chartData = readings.map((r) => ({
      name: r.reading_time ? new Date(r.reading_time).toLocaleDateString() : '',
      value: parseFloat(r.consumption_kwh || '0') || 0,
    }))
    return { data: chartData, usage: readings }
  },
}
