import { api } from './api'

/** POST /api/v1/recharges/intents — Create recharge intent (auth required) */
export type CreateIntentRequest = {
  meter_id: string
  amount_naira: number
  expected_units?: string
  tariff_snapshot?: Record<string, unknown>
  expires_at?: string
}

export type CreateIntentResponse = {
  intent_id: string
  recharge_id: string
  amount_naira: number
  expected_units?: string
  status: string
  expires_at?: string
  created_at?: string
}

/** POST /api/v1/recharges/confirm — Attach payment to recharge (auth required) */
export type ConfirmRechargeRequest = {
  intent_id: string
  payment_provider: string
  payment_reference: string
}

/** Full recharge transaction (confirm response & GET /recharges/{id}) */
export type RechargeTransaction = {
  id: string
  intent_id?: string
  user_id?: string
  meter_id?: string
  payment_provider?: string
  payment_reference?: string
  status: string
  amount_naira?: number
  created_at?: string
  updated_at?: string
}

/** GET /api/v1/users/me/recharges — List with pagination (limit default 20 max 100, offset default 0) */
export type ListRechargesParams = { limit?: number; offset?: number }

export const rechargesService = {
  async createIntent(
    meter_id: string,
    amount_naira: number,
    options?: { expected_units?: string; expires_at?: string }
  ): Promise<CreateIntentResponse> {
    const body: CreateIntentRequest = { meter_id, amount_naira }
    if (options?.expected_units != null) body.expected_units = options.expected_units
    if (options?.expires_at != null) body.expires_at = options.expires_at
    const { data } = await api.post<CreateIntentResponse>('/recharges/intents', body)
    return data
  },

  async confirm(
    intent_id: string,
    payment_provider: string,
    payment_reference: string
  ): Promise<RechargeTransaction> {
    const { data } = await api.post<RechargeTransaction>('/recharges/confirm', {
      intent_id,
      payment_provider,
      payment_reference,
    })
    return data
  },

  async getRecharge(id: string): Promise<RechargeTransaction> {
    const { data } = await api.get<RechargeTransaction>(`/recharges/${id}`)
    return data
  },

  async getMyRecharges(params?: ListRechargesParams): Promise<RechargeTransaction[]> {
    const limit = Math.min(params?.limit ?? 20, 100)
    const offset = params?.offset ?? 0
    const { data } = await api.get<RechargeTransaction[]>('/users/me/recharges', {
      params: { limit, offset },
    })
    return Array.isArray(data) ? data : []
  },
}
