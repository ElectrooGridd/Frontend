import { api } from './api'

/** GET /api/v1/users/me — UserResponse from Swagger */
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

export const userService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/users/me')
    return data
  },
}
