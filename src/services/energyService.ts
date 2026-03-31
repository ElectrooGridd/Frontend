import { api } from './api'
import type { UsageReading, AggregatedReading, UsageDataPoint } from '@/types/api'

export type { UsageReading, AggregatedReading } from '@/types/api'

export type UsageResponse = {
  data: UsageDataPoint[]
}

type UsageParams = {
  period?: 'daily' | 'weekly' | 'monthly'
  from?: string
  to?: string
  limit?: number
  offset?: number
}

function formatPeriodLabel(dateStr: string, period?: string): string {
  try {
    const d = new Date(dateStr)
    if (period === 'monthly') return d.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' })
    if (period === 'weekly') return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
    return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function parseResponse(data: unknown, period?: string): UsageResponse {
  const items = Array.isArray(data) ? data : []
  if (items.length === 0) return { data: [] }

  // Aggregated response (has period_start)
  if (items[0]?.period_start != null) {
    return {
      data: (items as AggregatedReading[]).map((r) => ({
        name: formatPeriodLabel(r.period_start, period),
        value: parseFloat(r.total_kwh || '0') || 0,
      })),
    }
  }

  // Raw readings
  return {
    data: (items as UsageReading[]).map((r) => ({
      name: formatPeriodLabel(r.reading_time, period),
      value: parseFloat(r.consumption_kwh || '0') || 0,
    })),
  }
}

export const energyService = {
  async getUsage(period?: 'daily' | 'weekly' | 'monthly', opts?: Omit<UsageParams, 'period'>): Promise<UsageResponse> {
    const params: UsageParams = { ...opts }
    if (period) params.period = period
    const { data } = await api.get('/users/me/usage', { params })
    return parseResponse(data, period)
  },

  async getUsageByMeter(meterId: string, period?: 'daily' | 'weekly' | 'monthly', opts?: Omit<UsageParams, 'period'>): Promise<UsageResponse> {
    const params: UsageParams = { ...opts }
    if (period) params.period = period
    const { data } = await api.get(`/users/me/usage/${meterId}`, { params })
    return parseResponse(data, period)
  },
}
