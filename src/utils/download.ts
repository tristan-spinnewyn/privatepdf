import { ensureExtension } from './file-name';

/**
 * Triggers a browser download of a Blob through a temporary link
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadPdf(data: Uint8Array, filename: string) {
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' });
  downloadBlob(blob, ensureExtension(filename, 'pdf'));
}

/**
 * Creates and downloads a ZIP file containing multiple files
 */
export async function downloadZip(files: { name: string; blob: Blob }[], zipName: string) {
  // Loaded on demand: every tool imports this module, only the image exports need JSZip
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.blob));

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, ensureExtension(zipName, 'zip'));
}
