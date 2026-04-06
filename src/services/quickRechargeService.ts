const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const BASE_URL = `${API_BASE}/api/v1`

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
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}

export const quickRechargeService = {
  async verifyMeter(meter_number: string): Promise<QuickVerifyResponse> {
    try {
      const res = await fetch(`${BASE_URL}/meters/verify/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meter_number }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message ?? errData.error ?? `Request failed: ${res.status}`)
      }
      const data = await res.json()
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
