import { PDFDocument } from 'pdf-lib';

/**
 * Loads a File into an editable pdf-lib document
 */
export async function loadEditablePdf(file: File): Promise<PDFDocument> {
  return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
}
