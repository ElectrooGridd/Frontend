import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://electrogrid-backend-dev.up.railway.app'
const BASE_URL = `${API_BASE}/api/v1`

/** Public axios instance — no auth token, no interceptors */
const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export type QuickVerifyResponse = {
  customer_name: string
  meter_number: string
  disco_name: string
  meter_type: string
  meter_id: string
  status: string
}

export type QuickRechargeResponse = {
  intent_id: string
  recharge_id: string
  payment_url?: string
  status: string
}

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (typeof data === 'string') return data
    if (data?.message) return data.message
    if (data?.error) return data.error
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}

export const quickRechargeService = {
  async verifyMeter(meter_number: string): Promise<QuickVerifyResponse> {
    try {
      const { data } = await publicApi.post<QuickVerifyResponse>('/meters/verify', { meter_number })
      return data
    } catch (err) {
      throw new Error(extractError(err))
    }
  },

  async createQuickRecharge(meter_id: string, amount_naira: number): Promise<QuickRechargeResponse> {
    try {
      const { data } = await publicApi.post<QuickRechargeResponse>('/recharges/quick', {
        meter_id,
        amount_kobo: Math.round(amount_naira * 100),
      })
      return data
    } catch (err) {
      throw new Error(extractError(err))
    }
  },
}
