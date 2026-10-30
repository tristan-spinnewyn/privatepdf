import { PDFDocument } from 'pdf-lib';

// 1x1 transparent PNG
export const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Minimal JPEG header (SOI + SOF0 1x1 grayscale + EOI): enough for pdf-lib to embed it
export const JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9,
]);

export async function createPdfFile(pageCount: number, name = 'doc.pdf', size: [number, number] = [400, 600]) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage(size);
  }
  const bytes = await doc.save();
  return new File([bytes as unknown as BlobPart], name, { type: 'application/pdf' });
}

export function loadPdf(bytes: Uint8Array) {
  return PDFDocument.load(bytes);
}
