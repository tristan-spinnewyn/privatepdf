import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFJS_ASSET_FOLDERS, pdfjsAssetUrl } from '../../config/pdfjs-assets';

// Worker emitted by Vite from the installed package: pdf.js refuses to run when the API
// and worker versions differ, so it must never be a copy that dependency updates skip.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// Loading tasks of the documents currently in use, so thumbnails and page counts reuse one parsed
// document. Each entry keeps the whole file and its pdf.js worker state alive until released.
const docCache = new Map<string, Promise<pdfjsLib.PDFDocumentProxy>>();

function getFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

async function loadPdfDocument(file: File): Promise<pdfjsLib.PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: pdfjsAssetUrl(PDFJS_ASSET_FOLDERS.cMaps),
    cMapPacked: true,
    standardFontDataUrl: pdfjsAssetUrl(PDFJS_ASSET_FOLDERS.standardFonts),
    wasmUrl: pdfjsAssetUrl(PDFJS_ASSET_FOLDERS.wasm),
    iccUrl: pdfjsAssetUrl(PDFJS_ASSET_FOLDERS.iccs),
  });
  return loadingTask.promise;
}

/**
 * Loads a File into a pdf.js document used for rendering, reusing it until `releasePdfDocument`
 */
export function getPdfDocument(file: File): Promise<pdfjsLib.PDFDocumentProxy> {
  const key = getFileKey(file);
  const cached = docCache.get(key);
  if (cached) return cached;

  const loading = loadPdfDocument(file);
  docCache.set(key, loading);
  // A failed load must not stay cached: the next request retries
  loading.catch(() => {
    if (docCache.get(key) === loading) docCache.delete(key);
  });
  return loading;
}

/**
 * Frees the pdf.js document of a file once no tool displays it anymore
 */
export async function releasePdfDocument(file: File): Promise<void> {
  const key = getFileKey(file);
  const loading = docCache.get(key);
  if (!loading) return;

  docCache.delete(key);
  try {
    const doc = await loading;
    await doc.loadingTask.destroy();
  } catch {
    // The document never loaded: nothing to free
  }
}

export async function getPdfPageCount(file: File): Promise<number> {
  const doc = await getPdfDocument(file);
  return doc.numPages;
}
