import { getPdfDocument } from './pdf-document-loader';
import { getCanvasContext } from '../../utils/canvas';

export interface PageThumbnailImage {
  pageNumber: number; // 1-indexed
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Renders a page into the given canvas, scaled to `targetWidth` (or 1.5x when omitted)
 */
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

  const context = getCanvasContext(canvas);
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

export async function renderPageThumbnail(
  file: File,
  pageNumber: number,
  targetWidth: number = 320
): Promise<{ dataUrl: string; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  const { width, height } = await renderPageToCanvas(file, pageNumber, canvas, targetWidth);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.85),
    width,
    height,
  };
}

/**
 * Renders a thumbnail for every page of the document, in order
 */
export async function renderAllPageThumbnails(file: File, targetWidth: number): Promise<PageThumbnailImage[]> {
  const doc = await getPdfDocument(file);
  const thumbnails: PageThumbnailImage[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const thumb = await renderPageThumbnail(file, pageNumber, targetWidth);
    thumbnails.push({ pageNumber, ...thumb });
  }

  return thumbnails;
}
