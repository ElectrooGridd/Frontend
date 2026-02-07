import { api } from './api'

export type Balance = { balance_naira?: number; balance?: number }

export const billingService = {
  async getBalance(): Promise<Balance> {
    const { data } = await api.get<Balance>('/billing/balance')
    return data
  },
}
