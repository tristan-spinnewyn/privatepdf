import type { TFunction } from 'i18next';
import { EncryptedPdfError } from '../services/pdf/pdf-errors';
import { ImageTooLargeError } from '../services/image/image-errors';

/**
 * A translated message explaining why processing failed, or `fallback` for unexpected errors
 */
export function describeProcessingError(error: unknown, t: TFunction, fallback: string): string {
  if (error instanceof EncryptedPdfError) return t('errors.encryptedPdf', { name: error.fileName });
  if (error instanceof ImageTooLargeError) return t('errors.imageTooLarge', { name: error.fileName });
  return fallback;
}
