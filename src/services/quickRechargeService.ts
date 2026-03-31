import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
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
      const { data } = await publicApi.post<{ data: QuickVerifyResponse }>('/meters/verify/public', { meter_number })
      return data.data
    } catch (err) {
      throw new Error(extractError(err))
    }
  },

  /**
   * Quick recharge is not yet supported by the backend.
   * The /recharges/quick endpoint does not exist — authenticated users
   * should use the standard rechargesService.createIntent flow instead.
   */
  async createQuickRecharge(_meter_id: string, _amount_naira: number): Promise<QuickRechargeResponse> {
    throw new Error('Quick recharge is not available. Please log in to recharge your meter.')
  },
}
