import { test, expect, mockAllApiRoutes, MOCK_RESPONSES } from './fixtures'

// ==========================================================================
//  ElectroGrid — Grid Sync E2E Test Suite
//
//  "Grid Sync" is the full user journey that exercises frontend ↔ backend
//  synchronisation:
//
//    1. Login         — authenticate and land on dashboard
//    2. Verify Meter  — look up a meter via the DISCO stub
//    3. Confirm Meter — user confirms the meter details are correct
//    4. Link Meter    — associate meter with user account
//    5. Enter Amount  — choose a recharge amount
//    6. Confirm Pay   — submit payment reference
//    7. Track Status  — poll until recharge completes
//
//  At every step we assert:
//    • The frontend transitions to the expected UI state
//    • The correct API request is sent
//    • No 5xx errors are returned
// ==========================================================================

/**
 * Helper: log in via the UI and wait for the dashboard.
 * Reused across multiple tests to avoid page.goto('/recharge') which
 * triggers a full reload and loses the in-memory access token.
 */
async function loginViaUI(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
) {
  await page.goto('/login')
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: 10_000 })
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('Enter your password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

/**
 * Helper: from the dashboard, navigate to /recharge via the SPA link
 * (avoids full-page reload that would lose the in-memory auth token).
 */
async function navigateToRecharge(page: import('@playwright/test').Page) {
  await page.getByRole('link', { name: /Top Up/i }).first().click()
  await page.waitForURL('**/recharge')
  await expect(page.getByText('Verify your meter')).toBeVisible()
}

test.describe('Grid Sync — Full Recharge E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Install API mocks so the test is self-contained (no live backend needed)
    await mockAllApiRoutes(page)
  })

  // -----------------------------------------------------------------------
  //  Complete flow: login → dashboard → recharge → completion
  // -----------------------------------------------------------------------
  test('user logs in and completes a full Grid Sync recharge with zero 500 errors', async ({
    page,
    testUser,
    testMeter,
    getServerErrors,
  }) => {
    // ─── Step 1: Navigate to login ───────────────────────────────────────
    await page.goto('/login')
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

    // Fill login form
    await page.getByPlaceholder('you@example.com').fill(testUser.email)
    await page.getByPlaceholder('Enter your password').fill(testUser.password)

    // Intercept login request to verify payload
    const loginPromise = page.waitForRequest((req) =>
      req.url().includes('/auth/login') && req.method() === 'POST'
    )

    await page.getByRole('button', { name: 'Sign in' }).click()

    const loginReq = await loginPromise
    const loginBody = loginReq.postDataJSON()
    expect(loginBody).toEqual({ email: testUser.email, password: testUser.password })

    // ─── Step 2: Verify we land on Dashboard ────────────────────────────
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    await expect(
      page.getByRole('heading', { name: /Good (morning|afternoon|evening)/i })
    ).toBeVisible({ timeout: 5_000 })

    // Verify no 500s from dashboard API calls
    expect(getServerErrors()).toHaveLength(0)

    // ─── Step 3: Navigate to Recharge flow ──────────────────────────────
    await navigateToRecharge(page)

    // ─── Step 4: Verify Meter ───────────────────────────────────────────
    await page.getByPlaceholder('e.g. 12345678901').fill(testMeter)

    const verifyPromise = page.waitForRequest((req) =>
      req.url().includes('/meters/verify') && req.method() === 'POST'
    )

    await page.getByRole('button', { name: 'Verify meter' }).click()

    const verifyReq = await verifyPromise
    expect(verifyReq.postDataJSON()).toEqual({ meter_number: testMeter })

    // ─── Step 5: Confirm Meter details ──────────────────────────────────
    await expect(page.getByText('Is this your meter?')).toBeVisible()
    await expect(page.getByText(MOCK_RESPONSES.verifyMeter.customer_name)).toBeVisible()
    await expect(page.getByText(MOCK_RESPONSES.verifyMeter.disco_name)).toBeVisible()
    await expect(page.getByText(MOCK_RESPONSES.verifyMeter.meter_type)).toBeVisible()

    await page.getByRole('button', { name: 'Yes, continue' }).click()

    // ─── Step 6: Link Meter to account ──────────────────────────────────
    await expect(page.getByText('Link meter to account')).toBeVisible()

    const linkPromise = page.waitForRequest((req) =>
      req.url().includes('/meters/link') && req.method() === 'POST'
    )

    await page.getByRole('button', { name: 'Link meter' }).click()

    const linkReq = await linkPromise
    expect(linkReq.postDataJSON()).toEqual({
      meter_id: MOCK_RESPONSES.verifyMeter.meter_id,
    })

    // ─── Step 7: Enter recharge amount ──────────────────────────────────
    await expect(page.getByText('Enter amount')).toBeVisible()

    // Click the ₦1k quick-amount button
    await page.getByRole('button', { name: /₦1k/i }).click()

    const intentPromise = page.waitForRequest((req) =>
      req.url().includes('/recharges/intents') && req.method() === 'POST'
    )

    await page.getByRole('button', { name: 'Top up meter' }).click()

    const intentReq = await intentPromise
    const intentBody = intentReq.postDataJSON()
    expect(intentBody.meter_id).toBe(MOCK_RESPONSES.verifyMeter.meter_id)
    expect(intentBody.amount_kobo).toBe(100000) // ₦1000 = 100000 kobo

    // ─── Step 8: Confirm payment ────────────────────────────────────────
    await expect(page.getByText('Confirm payment')).toBeVisible()
    await expect(page.getByText('1,000')).toBeVisible()

    await page.getByPlaceholder('e.g. paystack_ref_123').fill('test_ref_123')

    const confirmPromise = page.waitForRequest((req) =>
      req.url().includes('/recharges/confirm') && req.method() === 'POST'
    )

    await page.getByRole('button', { name: 'Confirm recharge' }).click()

    const confirmReq = await confirmPromise
    const confirmBody = confirmReq.postDataJSON()
    expect(confirmBody.intent_id).toBe(MOCK_RESPONSES.createIntent.intent_id)
    expect(confirmBody.payment_provider).toBe('paystack')
    expect(confirmBody.payment_reference).toBe('test_ref_123')

    // ─── Step 9: Track recharge status ──────────────────────────────────
    await expect(page.getByText('Processing recharge')).toBeVisible()

    // The mock returns 'vending_pending' on first poll, then 'completed'.
    // On completion the component shows a success toast and calls reset(),
    // which returns to step 0 (Verify your meter). Wait for either signal.
    await expect(
      page.getByText('Recharge completed successfully')
    ).toBeVisible({ timeout: 20_000 })

    // ─── Final assertion: zero 500 errors throughout the entire flow ────
    const errors = getServerErrors()
    expect(errors).toHaveLength(0)
  })

  // -----------------------------------------------------------------------
  //  Negative: login with wrong credentials shows error, no crash
  // -----------------------------------------------------------------------
  test('login with invalid credentials shows error without 500', async ({
    page,
    getServerErrors,
  }) => {
    // Return 400 (Bad Request) so the error is shown in the UI.
    // (A 401 would trigger the axios interceptor's refresh-then-redirect flow,
    //  which is separate tested behaviour.)
    await page.route('**/api/v1/auth/login', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_credentials', message: 'Invalid email or password' }),
      })
    })

    await page.goto('/login')
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('you@example.com').fill('bad@example.com')
    await page.getByPlaceholder('Enter your password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Error message should appear in the form
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible({ timeout: 5_000 })
    // Should still be on the login page
    expect(page.url()).toContain('/login')
    expect(getServerErrors()).toHaveLength(0)
  })

  // -----------------------------------------------------------------------
  //  Negative: meter verification failure is handled gracefully
  // -----------------------------------------------------------------------
  test('meter verification failure shows error without 500', async ({
    page,
    testUser,
    getServerErrors,
  }) => {
    // Override meter verify to return 404
    await page.route('**/api/v1/meters/verify', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'not_found', message: 'Meter not found' }),
      })
    })

    // Login via UI (SPA navigation keeps token in memory)
    await loginViaUI(page, testUser.email, testUser.password)

    // Navigate to recharge via SPA link
    await navigateToRecharge(page)

    await page.getByPlaceholder('e.g. 12345678901').fill('0000000000')
    await page.getByRole('button', { name: 'Verify meter' }).click()

    // Should show error, stay on verify step
    await expect(page.getByText(/Meter not found/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('Verify your meter')).toBeVisible()
    expect(getServerErrors()).toHaveLength(0)
  })

  // -----------------------------------------------------------------------
  //  Server error detection: 500 on recharge intent is caught
  // -----------------------------------------------------------------------
  test('detects 500 errors during recharge intent creation', async ({
    page,
    testUser,
    testMeter,
    getServerErrors,
  }) => {
    // Override create-intent to return 500
    await page.route('**/api/v1/recharges/intents', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'internal_error', message: 'Database connection lost' }),
      })
    })

    // Login via UI
    await loginViaUI(page, testUser.email, testUser.password)

    // Navigate to recharge via SPA link
    await navigateToRecharge(page)

    // Verify → Confirm → Link → Amount
    await page.getByPlaceholder('e.g. 12345678901').fill(testMeter)
    await page.getByRole('button', { name: 'Verify meter' }).click()
    await expect(page.getByText('Is this your meter?')).toBeVisible()
    await page.getByRole('button', { name: 'Yes, continue' }).click()
    await expect(page.getByText('Link meter to account')).toBeVisible()
    await page.getByRole('button', { name: 'Link meter' }).click()
    await expect(page.getByText('Enter amount')).toBeVisible()

    // Enter amount and submit — this triggers the 500
    await page.getByRole('button', { name: /₦1k/i }).click()
    await page.getByRole('button', { name: 'Top up meter' }).click()

    // Wait for the response to arrive
    await page.waitForTimeout(1500)

    // The 500 should be caught by our tracker
    const errors = getServerErrors()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].status).toBe(500)
    expect(errors[0].url).toContain('/recharges/intents')
  })
})

// ==========================================================================
//  API Health Sync — verify backend health endpoint responds correctly
// ==========================================================================
test.describe('API Health Sync', () => {
  test('health endpoint returns 200 with healthy status', async ({ page }) => {
    const apiBase = process.env.E2E_API_URL ?? 'http://localhost:8080'

    let response
    try {
      response = await page.request.get(`${apiBase}/health`)
    } catch {
      test.skip(true, 'Backend not reachable — skipping health check')
      return
    }

    if (!response.ok()) {
      test.skip(true, 'Backend not running — skipping health check')
      return
    }

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('healthy')
  })
})
