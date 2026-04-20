// Waitlist submission — posts to the ElectroGrid backend by default
// (POST /api/v1/waitlist) and mirrors every submission to localStorage
// as a safety net in case the backend is unreachable. VITE_WAITLIST_ENDPOINT
// lets us override the target for preview deployments without a backend.

export type WaitlistEntry = {
  email: string
  disco?: string
  meterNumber?: string
  source?: string
}

const STORAGE_KEY = 'eg_waitlist_entries'

function defaultEndpoint(): string {
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
  return `${apiBase}/api/v1/waitlist`
}

export const waitlistService = {
  async submit(entry: WaitlistEntry): Promise<void> {
    const payload = {
      ...entry,
      email: entry.email.trim().toLowerCase(),
    }

    try {
      const existing: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      const list = Array.isArray(existing) ? existing : []
      list.push({ ...payload, submittedAt: new Date().toISOString() })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    } catch {}

    const override = import.meta.env.VITE_WAITLIST_ENDPOINT as string | undefined
    const endpoint = override && override.length > 0 ? override : defaultEndpoint()

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      let message = 'Could not join the waitlist. Please try again.'
      try {
        const body = (await res.json()) as { message?: string }
        if (body.message) message = body.message
      } catch {}
      throw new Error(message)
    }
  },
}
