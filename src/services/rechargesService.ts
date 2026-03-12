import { api } from './api'

/** POST /api/v1/recharges/intents — Swagger: amount_kobo, meter_id, optional tariff_kobo_per_unit, expires_at */
export type CreateIntentRequest = {
  meter_id: string
  amount_kobo: number
  tariff_kobo_per_unit?: number
  expires_at?: string
}

export type CreateIntentResponse = {
  intent_id: string
  recharge_id: string
  amount_kobo: number
  expected_units_milli?: number
  status: string
  expires_at?: string
  created_at?: string
}

/** POST /api/v1/recharges/confirm */
export type ConfirmRechargeRequest = {
  intent_id: string
  payment_provider: string
  payment_reference: string
}

/** RechargeTransactionResponse — no amount in response, we derive from intent or show placeholder */
export type RechargeTransaction = {
  id: string
  intent_id?: string
  user_id?: string
  meter_id?: string
  payment_provider?: string
  payment_reference?: string
  status: string
  amount_kobo?: number
  created_at?: string
  updated_at?: string
}

export type ListRechargesParams = { limit?: number; offset?: number }

/** Convert Naira to Kobo (1 Naira = 100 Kobo) */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}

/** Convert Kobo to Naira */
export function koboToNaira(kobo: number): number {
  return kobo / 100
}

export const rechargesService = {
  async createIntent(
    meter_id: string,
    amount_naira: number,
    options?: { tariff_kobo_per_unit?: number; expires_at?: string }
  ): Promise<CreateIntentResponse> {
    const body: CreateIntentRequest = {
      meter_id,
      amount_kobo: nairaToKobo(amount_naira),
    }
    if (options?.tariff_kobo_per_unit != null) body.tariff_kobo_per_unit = options.tariff_kobo_per_unit
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
