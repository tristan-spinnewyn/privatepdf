import * as pdfjsLib from 'pdfjs-dist';
import { PDFJS_ASSET_FOLDERS, pdfjsAssetUrl } from '../../config/pdfjs-assets';

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
    cMapUrl: pdfjsAssetUrl(PDFJS_ASSET_FOLDERS.cMaps),
    cMapPacked: true,
    standardFontDataUrl: pdfjsAssetUrl(PDFJS_ASSET_FOLDERS.standardFonts),
    wasmUrl: pdfjsAssetUrl(PDFJS_ASSET_FOLDERS.wasm),
    iccUrl: pdfjsAssetUrl(PDFJS_ASSET_FOLDERS.iccs),
  });

  const doc = await loadingTask.promise;
  docCache.set(key, doc);
  return doc;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const doc = await getPdfDocument(file);
  return doc.numPages;
}
