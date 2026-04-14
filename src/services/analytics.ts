// Unified analytics wrapper: GA4, Meta Pixel, TikTok Pixel.
// Pixel snippets are injected in index.html and gated by env vars so
// missing IDs are a no-op (safe for local/dev).

type EventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    fbq?: (...args: unknown[]) => void
    ttq?: {
      track: (event: string, params?: EventParams) => void
      page: () => void
    }
  }
}

// Canonical event names — keep in sync with marketing dashboards.
export const Events = {
  LandingPageView: 'landing_page_view',
  ClickVerifyMeter: 'click_verify_meter',
  MeterVerificationSuccess: 'meter_verification_success',
  TopupStart: 'topup_start',
  PaymentSuccess: 'payment_success',
} as const

export type EventName = (typeof Events)[keyof typeof Events]

// Meta Pixel has a fixed standard-event vocabulary; map custom names
// to the closest standard event so the pixel optimizes correctly.
const metaStandardEvent: Partial<Record<EventName, string>> = {
  [Events.LandingPageView]: 'ViewContent',
  [Events.ClickVerifyMeter]: 'Lead',
  [Events.MeterVerificationSuccess]: 'Lead',
  [Events.TopupStart]: 'InitiateCheckout',
  [Events.PaymentSuccess]: 'Purchase',
}

export function trackEvent(name: EventName, params: EventParams = {}) {
  try {
    window.gtag?.('event', name, params)
  } catch {}
  try {
    const std = metaStandardEvent[name]
    if (std) window.fbq?.('track', std, params)
    window.fbq?.('trackCustom', name, params)
  } catch {}
  try {
    window.ttq?.track(name, params)
  } catch {}
}

export function trackPageView(path: string) {
  try {
    window.gtag?.('event', 'page_view', { page_path: path })
  } catch {}
  try {
    window.fbq?.('track', 'PageView')
  } catch {}
  try {
    window.ttq?.page()
  } catch {}
}
