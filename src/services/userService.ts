import { api } from './api'

export type User = { id: string; name: string; email: string }

export const userService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/users/me')
    return data
  },
}
