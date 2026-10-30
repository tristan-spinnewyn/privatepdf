import { PDFDocument } from 'pdf-lib';
import { loadEditablePdf } from './pdf-loader';

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const pdf = await loadEditablePdf(file);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  return await mergedPdf.save();
}
