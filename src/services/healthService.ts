const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export type HealthResponse = {
  status: string
  timestamp?: string
  checks?: Record<string, string>
}

export const healthService = {
  async check(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`)
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
    return res.json()
  },
}
