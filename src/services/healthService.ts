import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export type HealthResponse = {
  status: string
  timestamp?: string
  checks?: Record<string, string>
}

export const healthService = {
  async check(): Promise<HealthResponse> {
    const { data } = await axios.get<HealthResponse>(`${API_BASE}/health`)
    return data
  },
}
