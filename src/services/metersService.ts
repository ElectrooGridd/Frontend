import { api } from './api'
import type { VerifyMeterResponse } from '@/types/api'

export type { VerifyMeterResponse, MeterResponse } from '@/types/api'

export const metersService = {
  async verify(meter_number: string): Promise<VerifyMeterResponse> {
    const { data } = await api.post<VerifyMeterResponse>('/meters/verify', { meter_number })
    return data
  },

  async linkMeter(meter_id: string): Promise<{ message?: string }> {
    const { data } = await api.post('/users/me/meters/link', { meter_id })
    return data as { message?: string }
  },
}
