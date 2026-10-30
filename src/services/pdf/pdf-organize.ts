import { PDFDocument, degrees } from 'pdf-lib';
import { loadEditablePdf } from './pdf-loader';

export async function organizePdf(
  file: File,
  pageOrder: number[], // 0-indexed original page indices
  rotations: Map<number, number>, // original index -> additional degrees (e.g. 90, 180, 270)
  deletedPages: Set<number> // original 0-indexed
): Promise<Uint8Array> {
  const originalPdf = await loadEditablePdf(file);
  const newPdf = await PDFDocument.create();

  const validIndices = pageOrder.filter(idx => !deletedPages.has(idx));
  if (validIndices.length === 0) {
    throw new Error('The resulting document has no pages.');
  }

  const copiedPages = await newPdf.copyPages(originalPdf, validIndices);

  copiedPages.forEach((page, i) => {
    const originalIndex = validIndices[i];
    const addRotation = rotations.get(originalIndex) || 0;
    if (addRotation !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + addRotation) % 360));
    }
    newPdf.addPage(page);
  });

  return await newPdf.save();
}
