import { api } from './api'

/** POST /api/v1/meters/verify — Verify meter, get disco-derived details */
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

/** POST /api/v1/users/me/meters/link — Link verified meter to current user */
export type LinkMeterRequest = { meter_id: string; alias: string }

export type LinkMeterResponse = { message: string }

export const metersService = {
  async verify(meter_number: string): Promise<VerifyMeterResponse> {
    const { data } = await api.post<VerifyMeterResponse>('/meters/verify', { meter_number })
    return data
  },

  async linkMeter(meter_id: string, alias: string): Promise<LinkMeterResponse> {
    const { data } = await api.post<LinkMeterResponse>('/users/me/meters/link', { meter_id, alias })
    return data
  },
}
