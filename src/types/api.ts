// ---------------------------------------------------------------------------
// Shared types mirroring backend DTOs (internal/types/types.go)
// Single source of truth for all API response shapes.
// ---------------------------------------------------------------------------

/** GET /users/me */
export type User = {
  id: string
  name?: string
  email?: string
  phone?: string
  address?: string
  role?: string
  email_verified?: boolean
  created_at?: string
}

/** GET /billing/balance — raw backend response (milli-units) */
export type BalanceRaw = {
  total_recharged_milli?: number
  total_consumed_milli?: number
  balance_milli?: number
}

/** Normalized balance for UI */
export type Balance = {
  balance_kwh: number
  balance_naira: number
  total_recharged_kwh: number
  total_consumed_kwh: number
}

/** GET /notifications */
export type Notification = {
  id: string
  title?: string
  message?: string
  read?: boolean
  created_at?: string
}

/** UI-friendly alert shape derived from Notification */
export type Alert = {
  id: string
  title?: string
  message?: string
  type?: string
  read?: boolean
  created_at?: string
}

/** POST /meters/verify */
export type VerifyMeterResponse = {
  customer_name: string
  meter_number: string
  disco_id: string
  disco_code: string
  disco_name: string
  meter_type: string
  status: string
  meter_id?: string
}

/** GET /users/me/meters */
export type MeterResponse = {
  id: string
  disco_id: string
  meter_number: string
  customer_name: string
  meter_type: string
  status: string
  installed_at?: string
  created_at?: string
}

/** Usage reading (raw, no aggregation) */
export type UsageReading = {
  id: number
  meter_id: string
  consumption_kwh: string
  reading_time: string
}

/** Aggregated usage reading (with period param) */
export type AggregatedReading = {
  period_start: string
  total_kwh: string
}

/** Chart-ready usage data */
export type UsageDataPoint = {
  name: string
  value: number
}

/** Recharge transaction */
export type RechargeTransaction = {
  id: string
  intent_id?: string
  user_id?: string
  meter_id?: string
  payment_provider?: string
  payment_reference?: string
  status: string
  token?: string
  amount_kobo?: number
  units_milli?: number
  created_at?: string
  updated_at?: string
}

/** POST /recharges/intents response */
export type CreateIntentResponse = {
  intent_id: string
  recharge_id: string
  amount_kobo: number
  expected_units_milli?: number
  status: string
  expires_at?: string
  created_at?: string
  payment_reference?: string
  authorization_url?: string
  access_code?: string
  paystack_public_key?: string
}

/** POST /recharges/verify-payment response */
export type VerifyPaymentResponse = {
  verified: boolean
  status: string
  recharge_id: string
  amount_kobo: number
  channel: string
}

/** GET /billing/receipts */
export type Receipt = {
  id: string
  transaction_id: string
  receipt_number: string
  amount_kobo: number
  units_milli?: number
  issued_at: string
}
