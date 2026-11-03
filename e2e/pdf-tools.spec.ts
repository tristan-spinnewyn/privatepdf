import { PDFDocument } from 'pdf-lib'
import { createPdf, expect, PNG_UPLOAD, pdfUpload, test } from './fixtures.ts'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('merges two PDFs, counting their pages with the pdf.js worker', async ({ page }) => {
  await page.locator('input[type=file]').setInputFiles([
    pdfUpload('first.pdf', await createPdf(2)),
    pdfUpload('second.pdf', await createPdf(3)),
  ])
  await expect(page.getByText('5 pages total')).toBeVisible()

  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Merge 2 PDFs' }).click()
  const download = await downloading

  const merged = await PDFDocument.load(await (await download.createReadStream()).toArray().then(Buffer.concat))
  expect(merged.getPageCount()).toBe(5)
})

test('renders every page of a PDF to images', async ({ page }) => {
  await page.getByRole('button', { name: 'PDF -> Images' }).click()
  // Tools are lazy-loaded: until then the previous tool's file input is still on the page
  await expect(page.getByRole('heading', { name: 'Convert PDF to Images' })).toBeVisible()
  await page.locator('input[type=file]').setInputFiles(pdfUpload('pages.pdf', await createPdf(2)))

  await page.getByRole('button', { name: 'Extract all pages to images' }).click()

  await expect(page.getByText('2 page(s) converted to images!')).toBeVisible()
})

test('converts an image to another format', async ({ page }) => {
  await page.getByRole('button', { name: 'Convert Image' }).click()
  await expect(page.getByRole('heading', { name: 'Universal Image Converter' })).toBeVisible()
  await page.locator('input[type=file]').setInputFiles(PNG_UPLOAD)

  await page.getByRole('button', { name: 'Convert 1 images' }).click()

  await expect(page.getByText('Conversion finished successfully!')).toBeVisible()
})
