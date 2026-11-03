import { PDFDocument } from 'pdf-lib';
import { EncryptedPdfError } from './pdf-errors';

/**
 * Loads a File into an editable pdf-lib document, refusing encrypted ones
 */
export async function loadEditablePdf(file: File): Promise<PDFDocument> {
  // Parsed anyway so that an encrypted file gets a clear error instead of a generic parse failure
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  if (doc.isEncrypted) throw new EncryptedPdfError(file.name);
  return doc;
}
