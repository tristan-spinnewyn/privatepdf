import { PDFDocument } from 'pdf-lib';
import { loadImageElement } from '../image';
import { canvasToBlob, getCanvasContext } from '../../utils/canvas';

export interface ImagesToPdfOptions {
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 'none' | 'small' | 'normal';
}

export interface ImagePageLayout {
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// A4 standard measurements in points (72 points = 1 inch)
const A4_SHORT = 595.28;
const A4_LONG = 841.89;

const MARGIN_POINTS = {
  none: 0,
  small: 18, // 0.25 in
  normal: 36, // 0.5 in
};

/**
 * Picks the A4 page orientation and fits the image inside the margins, centered
 */
export function computeImagePageLayout(
  imageWidth: number,
  imageHeight: number,
  options: ImagesToPdfOptions
): ImagePageLayout {
  const m = MARGIN_POINTS[options.margin];
  const isLandscape =
    options.orientation === 'landscape' || (options.orientation === 'auto' && imageWidth > imageHeight);

  const pageWidth = isLandscape ? A4_LONG : A4_SHORT;
  const pageHeight = isLandscape ? A4_SHORT : A4_LONG;

  const usableWidth = pageWidth - m * 2;
  const usableHeight = pageHeight - m * 2;
  const scaleFactor = Math.min(usableWidth / imageWidth, usableHeight / imageHeight);

  const width = imageWidth * scaleFactor;
  const height = imageHeight * scaleFactor;

  return {
    pageWidth,
    pageHeight,
    x: m + (usableWidth - width) / 2,
    y: m + (usableHeight - height) / 2,
    width,
    height,
  };
}

/**
 * Converts any image file (PNG, JPG, WebP, HEIC iOS, etc.) to JPEG bytes supported by pdf-lib
 */
async function encodeImageAsJpeg(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const img = await loadImageElement(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  getCanvasContext(canvas).drawImage(img, 0, 0);

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9);
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

export async function imagesToPdf(
  files: File[],
  options: ImagesToPdfOptions = { orientation: 'auto', margin: 'normal' }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const image = await encodeImageAsJpeg(file);
    const embeddedImage = await pdfDoc.embedJpg(image.bytes);
    const layout = computeImagePageLayout(image.width, image.height, options);

    const page = pdfDoc.addPage([layout.pageWidth, layout.pageHeight]);
    page.drawImage(embeddedImage, {
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
    });
  }

  return await pdfDoc.save();
}
