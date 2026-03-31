import { test as base, expect, type Page, type Route } from '@playwright/test'

// ---------------------------------------------------------------------------
// Configuration — override via env vars
// ---------------------------------------------------------------------------
const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:8080'
const API_PREFIX = `${API_BASE}/api/v1`

// Test user credentials — must exist in the seeded sandbox DB
// (created by `make db-seed` with the test_users.sql seed file)
const TEST_USER = {
  email: process.env.E2E_USER_EMAIL ?? 'testuser@electrogrid.com',
  password: process.env.E2E_USER_PASSWORD ?? 'Password123!',
}

// Test meter number — must exist in the seeded sandbox DB
// (created by `make db-seed` with the meters.sql seed file)
const TEST_METER = process.env.E2E_METER_NUMBER ?? '4012345678'

// ---------------------------------------------------------------------------
// Server error tracker — collects any 5xx responses during a test
// ---------------------------------------------------------------------------
export type ServerError = {
  url: string
  status: number
  method: string
  timestamp: number
}

/**
 * Attaches a listener to the page that records every 5xx API response.
 * Returns a function that retrieves collected errors.
 */
export function trackServerErrors(page: Page): () => ServerError[] {
  const errors: ServerError[] = []

  page.on('response', (response) => {
    if (response.status() >= 500) {
      errors.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
        timestamp: Date.now(),
      })
    }
  })

  return () => [...errors]
}

// ---------------------------------------------------------------------------
// API route interceptor — mocks backend responses for isolated E2E tests
// ---------------------------------------------------------------------------

/** Standard mock payloads that mirror actual backend responses. */
export const MOCK_RESPONSES = {
  login: {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwiZW1haWwiOiJ0ZXN0dXNlckBlbGVjdHJvZ3JpZC5jb20iLCJyb2xlIjoidXNlciIsImV4cCI6OTk5OTk5OTk5OX0.test-signature',
  },

  refreshFail: { error: 'invalid_token', message: 'Refresh token expired' },

  me: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test User',
    email: 'testuser@electrogrid.com',
    role: 'user',
  },

  verifyMeter: {
    customer_name: 'Test Customer',
    meter_number: TEST_METER,
    disco_id: '00000000-0000-0000-0000-000000000010',
    disco_code: 'EEDC',
    disco_name: 'Enugu Electric Distribution Company',
    meter_type: 'prepaid',
    status: 'active',
    meter_id: '00000000-0000-0000-0000-000000000100',
  },

  linkMeter: { message: 'Meter linked successfully' },

  createIntent: {
    intent_id: '00000000-0000-0000-0000-000000001000',
    recharge_id: '00000000-0000-0000-0000-000000002000',
    amount_kobo: 100000,
    expected_units_milli: 259000,
    status: 'payment_pending',
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },

  confirmRecharge: {
    id: '00000000-0000-0000-0000-000000002000',
    intent_id: '00000000-0000-0000-0000-000000001000',
    user_id: '00000000-0000-0000-0000-000000000001',
    meter_id: '00000000-0000-0000-0000-000000000100',
    payment_provider: 'paystack',
    payment_reference: 'test_ref_123',
    status: 'payment_success',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  rechargePolling: [
    // First poll: still processing
    {
      id: '00000000-0000-0000-0000-000000002000',
      status: 'vending_pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Second poll: completed
    {
      id: '00000000-0000-0000-0000-000000002000',
      status: 'completed',
      token: '12345678901234567890',
      units_milli: 259000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],

  balance: { balance_milli: 451000, total_recharged_milli: 900000, total_consumed_milli: 449000 },

  usage: [],  // empty array — energyService.parseResponse handles it

  notifications: [],

  emptyRecharges: [],

  unreadCount: { unread_count: 0 },
}

/**
 * Installs API route handlers that intercept all backend calls and return
 * deterministic mock responses. This lets E2E tests run without a live backend.
 */
export async function mockAllApiRoutes(page: Page) {
  let rechargePollIndex = 0

  // Helper: intercept a route and respond with JSON
  const mock = (
    urlPattern: string | RegExp,
    body: unknown,
    options?: { status?: number; method?: string }
  ) =>
    page.route(urlPattern, async (route: Route) => {
      if (options?.method && route.request().method() !== options.method) {
        return route.fallback()
      }
      await route.fulfill({
        status: options?.status ?? 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
    })

  // Playwright matches routes in REVERSE registration order (last = highest
  // priority). Register the catch-all FIRST so specific mocks take precedence.

  // ─── Catch-all (lowest priority): prevent unmocked API calls from reaching
  //     the real Railway backend, which would return 401 for our fake token
  //     and trigger the refresh→redirect→logout loop.
  await page.route(/\/api\/v1\//, async (route: Route) => {
    console.warn(`[E2E] Unmocked API call: ${route.request().method()} ${route.request().url()}`)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })

  // ─── Specific mocks (higher priority, registered after catch-all) ──────

  // Auth -------------------------------------------------------------------
  await mock(/\/api\/v1\/auth\/login/, MOCK_RESPONSES.login, { method: 'POST' })
  await mock(/\/api\/v1\/auth\/refresh/, MOCK_RESPONSES.refreshFail, { status: 401, method: 'POST' })

  // User profile (exact path — must not swallow /users/me/meters etc.)
  await page.route(/\/api\/v1\/users\/me(\?|$)/, async (route: Route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RESPONSES.me),
    })
  })

  // User's meters, usage, recharges
  await mock(/\/api\/v1\/users\/me\/meters\/link/, MOCK_RESPONSES.linkMeter, { method: 'POST' })
  await mock(/\/api\/v1\/users\/me\/meters/, [], { method: 'GET' })
  await mock(/\/api\/v1\/users\/me\/usage/, MOCK_RESPONSES.usage, { method: 'GET' })
  await mock(/\/api\/v1\/users\/me\/recharges/, MOCK_RESPONSES.emptyRecharges, { method: 'GET' })

  // Meters -----------------------------------------------------------------
  await mock(/\/api\/v1\/meters\/verify/, MOCK_RESPONSES.verifyMeter, { method: 'POST' })

  // Recharges --------------------------------------------------------------
  await mock(/\/api\/v1\/recharges\/intents/, MOCK_RESPONSES.createIntent, { method: 'POST' })
  await mock(/\/api\/v1\/recharges\/confirm/, MOCK_RESPONSES.confirmRecharge, { method: 'POST' })

  // Polling endpoint — returns progressive statuses
  await page.route(/\/api\/v1\/recharges\/[0-9a-f-]+/, async (route: Route) => {
    if (route.request().method() !== 'GET') return route.fallback()

    const polls = MOCK_RESPONSES.rechargePolling
    const response = polls[Math.min(rechargePollIndex, polls.length - 1)]
    rechargePollIndex++

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })

  // Dashboard data ---------------------------------------------------------
  await mock(/\/api\/v1\/billing\/balance/, MOCK_RESPONSES.balance, { method: 'GET' })
  await mock(/\/api\/v1\/billing\/receipts/, [], { method: 'GET' })

  // Notifications (exact /notifications path, not /notifications/something)
  await page.route(/\/api\/v1\/notifications(\?|$)/, async (route: Route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RESPONSES.notifications),
    })
  })
  await mock(/\/api\/v1\/notifications\/unread-count/, MOCK_RESPONSES.unreadCount, { method: 'GET' })
  await mock(/\/api\/v1\/notifications\//, { message: 'ok' }, { method: 'PUT' })
}

// ---------------------------------------------------------------------------
// Custom test fixture that provides helpers on every test
// ---------------------------------------------------------------------------
type E2EFixtures = {
  apiBase: string
  testUser: { email: string; password: string }
  testMeter: string
  getServerErrors: () => ServerError[]
}

export const test = base.extend<E2EFixtures>({
  apiBase: [API_PREFIX, { option: true }],
  testUser: [TEST_USER, { option: true }],
  testMeter: [TEST_METER, { option: true }],

  getServerErrors: async ({ page }, use) => {
    const getter = trackServerErrors(page)
    await use(getter)
  },
})

export { expect }
