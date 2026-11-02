import { test as base, expect } from '@playwright/test'
import { PDFDocument } from 'pdf-lib'

declare global {
  interface Window {
    cspViolations: string[]
  }
}

/**
 * Fails any test during which the page triggered a Content-Security-Policy violation
 */
export const test = base.extend<{ cspGuard: void }>({
  cspGuard: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        window.cspViolations = []
        document.addEventListener('securitypolicyviolation', (event) => {
          window.cspViolations.push(`${event.violatedDirective} blocked ${event.blockedURI || 'inline code'}`)
        })
      })
      await use()
      expect(await page.evaluate(() => window.cspViolations)).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

export async function createPdf(pageCount: number, options: { encrypted?: boolean } = {}): Promise<Buffer> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) doc.addPage([400, 600])
  // pdf-lib cannot encrypt: an /Encrypt trailer entry is enough for the app to treat the file as encrypted
  if (options.encrypted) doc.context.trailerInfo.Encrypt = doc.context.obj({ Filter: 'Standard', V: 2, R: 3 })
  return Buffer.from(await doc.save())
}

export function pdfUpload(name: string, buffer: Buffer) {
  return { name, mimeType: 'application/pdf', buffer }
}

// 1x1 opaque red PNG
export const PNG_UPLOAD = {
  name: 'pixel.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
    'base64'
  ),
}
