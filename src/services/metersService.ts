import { api } from './api'

/** POST /api/v1/meters/verify — Verify meter (auth required) */
export type VerifyMeterRequest = { meter_number: string }

export type VerifyMeterResponse = {
  customer_name: string
  meter_number: string
  disco_id: string
  disco_code: string
  disco_name: string
  meter_type: string
  status: string
  meter_id: string
}

/** POST /api/v1/users/me/meters/link — Link meter (Swagger: only meter_id) */
export type LinkMeterRequest = { meter_id: string }

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
