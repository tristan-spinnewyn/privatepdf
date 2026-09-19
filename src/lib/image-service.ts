import heic2any from 'heic2any';
import JSZip from 'jszip';
import type { ImageFormat } from '../types';

export interface ConvertOptions {
  targetFormat: ImageFormat;
  quality?: number; // 0.1 to 1.0 (for JPG, WEBP, AVIF)
  scale?: number; // 1 = original, 0.75, 0.5, etc.
  maxWidth?: number;
  maxHeight?: number;
  icoSize?: number; // 16, 32, 48, 64, 128, 256
  fillColor?: string; // background color for transparent images when converting to JPG (default: '#ffffff')
}

/**
 * Checks if a file is an Apple iOS HEIC / HEIF format
 */
export function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  );
}

/**
 * Loads any supported image file, decoding HEIC if needed, and returns an HTMLImageElement
 */
export async function loadImageElement(file: File): Promise<HTMLImageElement> {
  let blob: Blob = file;

  if (isHeicFile(file)) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.95,
      });
      blob = Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.error('HEIC conversion error:', err);
      throw new Error(`Impossible de décoder le fichier photo iOS HEIC (${file.name})`);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Échec du chargement de l'image ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Encodes canvas pixels into standard 24-bit Windows Bitmap (.bmp)
 */
function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Row width in bytes padded to a multiple of 4
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BMP Header (14 bytes)
  view.setUint16(0, 0x4d42, false); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 54, true); // data offset

  // DIB Header - BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // bottom-to-top
  view.setUint16(26, 1, true); // color planes
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(30, 0, true); // no compression
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // ~72 DPI
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // Pixels: BMP is stored bottom-to-top, BGR format
  const bytes = new Uint8Array(buffer);
  let pos = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      bytes[pos++] = data[srcIdx + 2]; // Blue
      bytes[pos++] = data[srcIdx + 1]; // Green
      bytes[pos++] = data[srcIdx];     // Red
    }
    // Padding
    const padding = rowSize - width * 3;
    for (let p = 0; p < padding; p++) {
      bytes[pos++] = 0;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Encodes a PNG blob into a standard Windows .ico file with PNG container
 */
async function pngToIcoBlob(pngBlob: Blob, size: number): Promise<Blob> {
  const pngBuffer = await pngBlob.arrayBuffer();
  const pngBytes = new Uint8Array(pngBuffer);

  const headerSize = 6;
  const dirEntrySize = 16;
  const totalSize = headerSize + dirEntrySize + pngBytes.length;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // ICO Header
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // 1 = Icon
  view.setUint16(4, 1, true); // Number of images (1)

  // Directory Entry
  view.setUint8(6, size >= 256 ? 0 : size); // Width (0 means 256)
  view.setUint8(7, size >= 256 ? 0 : size); // Height
  view.setUint8(8, 0); // Palette colors
  view.setUint8(9, 0); // Reserved
  view.setUint16(10, 1, true); // Color planes
  view.setUint16(12, 32, true); // Bits per pixel
  view.setUint32(14, pngBytes.length, true); // Size of PNG image
  view.setUint32(18, 22, true); // Offset = 6 + 16 = 22

  // Copy PNG payload
  const resultBytes = new Uint8Array(buffer);
  resultBytes.set(pngBytes, 22);

  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Converts an image file into the desired target format with custom options
 */
export async function convertImage(
  file: File,
  options: ConvertOptions
): Promise<{ blob: Blob; width: number; height: number; filename: string }> {
  const img = await loadImageElement(file);

  let targetWidth = img.naturalWidth;
  let targetHeight = img.naturalHeight;

  // ICO format requires square dimensions
  if (options.targetFormat === 'ico') {
    const icoSize = options.icoSize || 64;
    targetWidth = icoSize;
    targetHeight = icoSize;
  } else {
    // Scale or max dimensions
    if (options.scale && options.scale > 0 && options.scale <= 1) {
      targetWidth = Math.round(targetWidth * options.scale);
      targetHeight = Math.round(targetHeight * options.scale);
    }

    if (options.maxWidth && targetWidth > options.maxWidth) {
      const ratio = options.maxWidth / targetWidth;
      targetWidth = options.maxWidth;
      targetHeight = Math.round(targetHeight * ratio);
    }

    if (options.maxHeight && targetHeight > options.maxHeight) {
      const ratio = options.maxHeight / targetHeight;
      targetHeight = options.maxHeight;
      targetWidth = Math.round(targetWidth * ratio);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, targetWidth);
  canvas.height = Math.max(1, targetHeight);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Contexte canvas 2D introuvable');

  // Fill background with solid color if converting to format without transparency (JPG, BMP)
  if (options.targetFormat === 'jpg' || options.targetFormat === 'bmp') {
    ctx.fillStyle = options.fillColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const quality = options.quality !== undefined ? options.quality : 0.90;
  let resultBlob: Blob;

  if (options.targetFormat === 'bmp') {
    resultBlob = canvasToBmpBlob(canvas);
  } else if (options.targetFormat === 'ico') {
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Erreur encodage ICO PNG'));
      }, 'image/png');
    });
    resultBlob = await pngToIcoBlob(pngBlob, canvas.width);
  } else {
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
    };

    const mime = mimeMap[options.targetFormat] || 'image/jpeg';
    resultBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else {
            // Fallback for browsers that do not support encoding to AVIF
            if (options.targetFormat === 'avif') {
              canvas.toBlob((fallbackBlob) => {
                if (fallbackBlob) resolve(fallbackBlob);
                else reject(new Error('Erreur de conversion'));
              }, 'image/webp', quality);
            } else {
              reject(new Error(`Impossible d'encoder au format ${options.targetFormat}`));
            }
          }
        },
        mime,
        quality
      );
    });
  }

  // Generate output filename
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const extension = options.targetFormat === 'jpg' ? 'jpg' : options.targetFormat;
  const filename = `${baseName}.${extension}`;

  return {
    blob: resultBlob,
    width: canvas.width,
    height: canvas.height,
    filename,
  };
}

/**
 * Downloads a single Blob
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Creates and downloads a ZIP file containing multiple files
 */
export async function downloadZip(files: { name: string; blob: Blob }[], zipName: string) {
  const zip = new JSZip();

  files.forEach((f) => {
    zip.file(f.name, f.blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadFile(zipBlob, zipName.endsWith('.zip') ? zipName : `${zipName}.zip`);
}
