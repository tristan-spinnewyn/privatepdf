import * as pdfjsLib from 'pdfjs-dist';

// Point worker to static worker file in public/
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Cache for loaded PDF documents to avoid re-parsing during thumbnail generation
const docCache = new Map<string, pdfjsLib.PDFDocumentProxy>();

function getFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Loads a File into a pdf.js document used for rendering
 */
export async function getPdfDocument(file: File): Promise<pdfjsLib.PDFDocumentProxy> {
  const key = getFileKey(file);
  const cached = docCache.get(key);
  if (cached) return cached;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const doc = await loadingTask.promise;
  docCache.set(key, doc);
  return doc;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const doc = await getPdfDocument(file);
  return doc.numPages;
}
