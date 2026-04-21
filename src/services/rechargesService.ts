import { api } from './api'
import type { CreateIntentResponse, RechargeTransaction, VerifyPaymentResponse } from '@/types/api'

export type { CreateIntentResponse, RechargeTransaction, VerifyPaymentResponse } from '@/types/api'

type CreateIntentRequest = {
  meter_id: string
  amount_kobo: number
  tariff_kobo_per_unit?: number
  expires_at?: string
}

type ListRechargesParams = { limit?: number; offset?: number }

/** Convert Naira to Kobo (1 Naira = 100 Kobo) */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}

/** Convert Kobo to Naira */
export function koboToNaira(kobo: number): number {
  return kobo / 100
}

/** Default tariff in kobo per unit (₦38.575/kWh = 3857.50 kobo = 385750 in integer kobo) */
const DEFAULT_TARIFF_KOBO_PER_UNIT = 385750

// The backend requires an `Idempotency-Key` header on the three money-moving
// recharge endpoints (createIntent, confirm, verifyPayment). The server hashes
// method+path+body and rejects reuse of the same key with a different body
// (422 idempotency_key_reused), so each endpoint MUST generate its OWN fresh
// key — do not share one key across the three calls in a single payment flow.
// Keep these inline: a shared variable at the call site would be a footgun.
function newIdempotencyKey(): string {
  return crypto.randomUUID()
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
      tariff_kobo_per_unit: options?.tariff_kobo_per_unit ?? DEFAULT_TARIFF_KOBO_PER_UNIT,
    }
    if (options?.expires_at != null) body.expires_at = options.expires_at
    const { data } = await api.post<CreateIntentResponse>('/recharges/intents', body, {
      headers: { 'Idempotency-Key': newIdempotencyKey() },
    })
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
    }, {
      headers: { 'Idempotency-Key': newIdempotencyKey() },
    })
    return data
  },

  async getRecharge(id: string): Promise<RechargeTransaction> {
    const { data } = await api.get<RechargeTransaction>(`/recharges/${id}`)
    return data
  },

  async verifyPayment(intent_id: string, reference: string): Promise<VerifyPaymentResponse> {
    const { data } = await api.post<VerifyPaymentResponse>('/recharges/verify-payment', {
      intent_id,
      reference,
    }, {
      headers: { 'Idempotency-Key': newIdempotencyKey() },
    })
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
