import { api } from './api'
import type { User } from '@/types/api'

export type { User } from '@/types/api'

export const userService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/users/me')
    return data
  },
}
