import { getPdfDocument } from './pdf-document-loader';
import { downloadZip } from '../../utils/download';
import { canvasToBlob, getCanvasContext } from '../../utils/canvas';
import { stripExtension } from '../../utils/file-name';

export interface PdfPageImage {
  pageNumber: number;
  blob: Blob;
  filename: string;
  dataUrl: string;
  width: number;
  height: number;
}

export type PdfImageFormat = 'png' | 'jpg' | 'webp';

const MIME_BY_FORMAT: Record<PdfImageFormat, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

export async function convertPdfToImages(
  file: File,
  options: {
    format: PdfImageFormat;
    quality?: number;
    scale?: number; // 1 = 72dpi, 2 = 144dpi (crisp print quality), 3 = ultra HD
    onProgress?: (current: number, total: number) => void;
  }
): Promise<PdfPageImage[]> {
  const doc = await getPdfDocument(file);
  const numPages = doc.numPages;
  const results: PdfPageImage[] = [];
  const baseName = stripExtension(file.name);

  const scale = options.scale || 2.0; // 2x default for high quality
  const mime = MIME_BY_FORMAT[options.format];
  const quality = options.quality !== undefined ? options.quality : 0.92;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = getCanvasContext(canvas);

    // If JPEG, fill white background
    if (options.format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({
      canvas: canvas,
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    const blob = await canvasToBlob(canvas, mime, quality);

    results.push({
      pageNumber: pageNum,
      blob,
      filename: `${baseName}_page_${pageNum}.${options.format}`,
      dataUrl: canvas.toDataURL(mime, quality),
      width: canvas.width,
      height: canvas.height,
    });

    options.onProgress?.(pageNum, numPages);
  }

  return results;
}

export async function downloadPdfImagesAsZip(images: PdfPageImage[], pdfFileName: string) {
  const files = images.map((img) => ({
    name: img.filename,
    blob: img.blob,
  }));
  await downloadZip(files, `${stripExtension(pdfFileName)}_images.zip`);
}
