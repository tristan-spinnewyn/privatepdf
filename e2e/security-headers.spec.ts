import { expect, test } from './fixtures.ts'

test('serves the app with the Content-Security-Policy and loads without violations', async ({ page }) => {
  const response = await page.goto('/')

  const headers = response!.headers()
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['x-content-type-options']).toBe('nosniff')
  await expect(page.getByRole('heading', { name: 'Merge PDF Files' })).toBeVisible()
})
