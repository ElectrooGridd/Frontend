import { defineConfig, devices } from '@playwright/test'

/**
 * ElectroGrid E2E Test Configuration
 *
 * Runs against the local Vite dev server (frontend) with API calls
 * routed to the local Go backend. Both servers must be running:
 *   - Frontend: npm run dev          (http://localhost:5173)
 *   - Backend:  make run             (http://localhost:8080)
 *
 * Alternatively, set E2E_BASE_URL and E2E_API_URL env vars to point
 * at deployed environments.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // sequential — tests share auth state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : [['html', { open: 'never' }], ['list']],
  timeout: 60_000,

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
