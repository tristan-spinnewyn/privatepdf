import type { ImageFormat } from '../../types';
import { loadImageElement } from './image-loader';
import { canvasToBmpBlob, pngToIcoBlob } from './image-encoders';
import { canvasToBlob, getCanvasContext } from '../../utils/canvas';
import { stripExtension } from '../../utils/file-name';

export interface ConvertOptions {
  targetFormat: ImageFormat;
  quality?: number; // 0.1 to 1.0 (for JPG, WEBP, AVIF)
  scale?: number; // 1 = original, 0.75, 0.5, etc.
  maxWidth?: number;
  maxHeight?: number;
  icoSize?: number; // 16, 32, 48, 64, 128, 256
  fillColor?: string; // background color for transparent images when converting to JPG (default: '#ffffff')
}

export interface ConvertedImage {
  blob: Blob;
  width: number;
  height: number;
  filename: string;
}

const MIME_BY_FORMAT: Partial<Record<ImageFormat, string>> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

/**
 * Computes the output dimensions from the source size and the conversion options
 */
export function computeTargetSize(
  sourceWidth: number,
  sourceHeight: number,
  options: ConvertOptions
): { width: number; height: number } {
  // ICO format requires square dimensions
  if (options.targetFormat === 'ico') {
    const icoSize = options.icoSize || 64;
    return { width: icoSize, height: icoSize };
  }

  let width = sourceWidth;
  let height = sourceHeight;

  if (options.scale && options.scale > 0 && options.scale <= 1) {
    width = Math.round(width * options.scale);
    height = Math.round(height * options.scale);
  }

  if (options.maxWidth && width > options.maxWidth) {
    const ratio = options.maxWidth / width;
    width = options.maxWidth;
    height = Math.round(height * ratio);
  }

  if (options.maxHeight && height > options.maxHeight) {
    const ratio = options.maxHeight / height;
    height = options.maxHeight;
    width = Math.round(width * ratio);
  }

  return { width, height };
}

async function encodeCanvas(canvas: HTMLCanvasElement, format: ImageFormat, quality: number): Promise<Blob> {
  if (format === 'bmp') {
    return canvasToBmpBlob(canvas);
  }

  if (format === 'ico') {
    return pngToIcoBlob(await canvasToBlob(canvas, 'image/png'), canvas.width);
  }

  try {
    return await canvasToBlob(canvas, MIME_BY_FORMAT[format] || 'image/jpeg', quality);
  } catch (err) {
    // Fallback for browsers that do not support encoding to AVIF
    if (format === 'avif') return canvasToBlob(canvas, 'image/webp', quality);
    throw err;
  }
}

/**
 * Converts an image file into the desired target format with custom options
 */
export async function convertImage(file: File, options: ConvertOptions): Promise<ConvertedImage> {
  const img = await loadImageElement(file);
  const target = computeTargetSize(img.naturalWidth, img.naturalHeight, options);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, target.width);
  canvas.height = Math.max(1, target.height);

  const ctx = getCanvasContext(canvas);

  // Fill background with solid color if converting to format without transparency (JPG, BMP)
  if (options.targetFormat === 'jpg' || options.targetFormat === 'bmp') {
    ctx.fillStyle = options.fillColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const quality = options.quality !== undefined ? options.quality : 0.9;
  const blob = await encodeCanvas(canvas, options.targetFormat, quality);

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    filename: `${stripExtension(file.name)}.${options.targetFormat}`,
  };
}
