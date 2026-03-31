import { api } from './api'
import type { Balance, BalanceRaw } from '@/types/api'

export type { Balance } from '@/types/api'

/** Tariff rate: naira per kWh (used to estimate naira value from kWh) */
const TARIFF_NAIRA_PER_KWH = 40

/** Convert milli-units (backend) to kWh */
function milliToKwh(milli: number): number {
  return milli / 1000
}

export const billingService = {
  async getBalance(): Promise<Balance> {
    const { data } = await api.get<BalanceRaw>('/billing/balance')
    const balanceKwh = milliToKwh(data.balance_milli ?? 0)
    return {
      balance_kwh: balanceKwh,
      balance_naira: balanceKwh * TARIFF_NAIRA_PER_KWH,
      total_recharged_kwh: milliToKwh(data.total_recharged_milli ?? 0),
      total_consumed_kwh: milliToKwh(data.total_consumed_milli ?? 0),
    }
  },
}
