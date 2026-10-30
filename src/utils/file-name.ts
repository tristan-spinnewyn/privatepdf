/**
 * Removes the last extension from a file name ("report.final.pdf" -> "report.final")
 */
export function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

/**
 * Appends ".<extension>" unless the file name already ends with it
 */
export function ensureExtension(fileName: string, extension: string): string {
  return fileName.endsWith(`.${extension}`) ? fileName : `${fileName}.${extension}`;
}
