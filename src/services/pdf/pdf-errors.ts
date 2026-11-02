/**
 * Raised for password-protected or encrypted PDFs: pdf-lib cannot decrypt them, so any
 * document it builds from one would be unreadable
 */
export class EncryptedPdfError extends Error {
  readonly fileName: string;

  constructor(fileName: string) {
    super(`${fileName} is encrypted`);
    this.name = 'EncryptedPdfError';
    this.fileName = fileName;
  }
}
