import { PDFDocument } from 'pdf-lib';
import { loadEditablePdf } from './pdf-loader';

export async function splitPdf(file: File, pageNumbers: number[]): Promise<Uint8Array> {
  // pageNumbers is 1-indexed
  if (!pageNumbers.length) {
    throw new Error('Select at least one page.');
  }

  const originalPdf = await loadEditablePdf(file);
  const newPdf = await PDFDocument.create();

  const indices = pageNumbers
    .map(p => p - 1)
    .filter(idx => idx >= 0 && idx < originalPdf.getPageCount());

  if (!indices.length) {
    throw new Error('No valid page selected.');
  }

  const copiedPages = await newPdf.copyPages(originalPdf, indices);
  copiedPages.forEach(page => newPdf.addPage(page));

  return await newPdf.save();
}
