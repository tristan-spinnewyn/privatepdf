import * as pdfjsLib from 'pdfjs-dist';

// Point worker to static worker file in public/
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Cache for loaded PDF documents to avoid re-parsing during thumbnail generation
const docCache = new Map<string, pdfjsLib.PDFDocumentProxy>();

function getFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

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

export async function renderPageThumbnail(
  file: File,
  pageNumber: number,
  targetWidth: number = 320
): Promise<{ dataUrl: string; width: number; height: number }> {
  const doc = await getPdfDocument(file);
  const page = await doc.getPage(pageNumber);

  const initialViewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / initialViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Impossible de créer le contexte 2D du canvas');
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({
    canvas: canvas,
    canvasContext: context,
    viewport: viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

  return {
    dataUrl,
    width: viewport.width,
    height: viewport.height,
  };
}

export async function renderPageToCanvas(
  file: File,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  targetWidth?: number
): Promise<{ width: number; height: number }> {
  const doc = await getPdfDocument(file);
  const page = await doc.getPage(pageNumber);

  const baseViewport = page.getViewport({ scale: 1 });
  const scale = targetWidth ? targetWidth / baseViewport.width : 1.5;
  const viewport = page.getViewport({ scale });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Contexte canvas introuvable');
  }

  // Clear before rendering
  context.clearRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvas: canvas,
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return {
    width: viewport.width,
    height: viewport.height,
  };
}
