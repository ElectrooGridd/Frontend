import { api } from './api'

export type UsagePoint = { date?: string; value?: number; usage?: number }
export type UsageResponse = { data?: UsagePoint[]; usage?: UsagePoint[]; period?: string }

export const energyService = {
  async getUsage(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<UsageResponse> {
    const { data } = await api.get<UsageResponse>('/energy/usage', { params: { period } })
    return data
  },
}
