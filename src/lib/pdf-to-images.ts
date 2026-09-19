import { getPdfDocument } from './pdf-renderer';
import { downloadZip, downloadFile } from './image-service';

export interface PdfPageImage {
  pageNumber: number;
  blob: Blob;
  filename: string;
  dataUrl: string;
  width: number;
  height: number;
}

export async function convertPdfToImages(
  file: File,
  options: {
    format: 'png' | 'jpg' | 'webp';
    quality?: number;
    scale?: number; // 1 = 72dpi, 2 = 144dpi (crisp print quality), 3 = ultra HD
    onProgress?: (current: number, total: number) => void;
  }
): Promise<PdfPageImage[]> {
  const doc = await getPdfDocument(file);
  const numPages = doc.numPages;
  const results: PdfPageImage[] = [];
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  const scale = options.scale || 2.0; // 2x default for high quality
  const mimeMap = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
  };
  const mime = mimeMap[options.format];
  const quality = options.quality !== undefined ? options.quality : 0.92;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexte canvas inaccessible');

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

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Erreur de conversion de page'));
      }, mime, quality);
    });

    const extension = options.format === 'jpg' ? 'jpg' : options.format;
    const filename = `${baseName}_page_${pageNum}.${extension}`;
    const dataUrl = canvas.toDataURL(mime, quality);

    results.push({
      pageNumber: pageNum,
      blob,
      filename,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    });

    if (options.onProgress) {
      options.onProgress(pageNum, numPages);
    }
  }

  return results;
}

export async function downloadPdfImagesAsZip(
  images: PdfPageImage[],
  pdfFileName: string
) {
  const baseName = pdfFileName.replace(/\.[^/.]+$/, '');
  const files = images.map((img) => ({
    name: img.filename,
    blob: img.blob,
  }));
  await downloadZip(files, `${baseName}_images.zip`);
}

export { downloadFile };
