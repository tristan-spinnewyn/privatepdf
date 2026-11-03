import { defineConfig, devices } from '@playwright/test'

// CI points E2E_BASE_URL at the production Docker image; locally, the production build is served
// by `vite preview`, which sends the same security headers (CSP included) as nginx
const externalBaseUrl = process.env.E2E_BASE_URL
const PREVIEW_URL = 'http://localhost:4173'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: externalBaseUrl ?? PREVIEW_URL,
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'pnpm build && pnpm preview --port 4173 --strictPort',
        url: PREVIEW_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
