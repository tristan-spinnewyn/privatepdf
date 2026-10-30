import { getCanvasContext } from '../../utils/canvas';

/**
 * Encodes canvas pixels into standard 24-bit Windows Bitmap (.bmp)
 */
export function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = getCanvasContext(canvas);

  const width = canvas.width;
  const height = canvas.height;
  const data = ctx.getImageData(0, 0, width, height).data;

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
  const padding = rowSize - width * 3;
  let pos = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      bytes[pos++] = data[srcIdx + 2]; // Blue
      bytes[pos++] = data[srcIdx + 1]; // Green
      bytes[pos++] = data[srcIdx];     // Red
    }
    pos += padding; // padding bytes are already zero
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Encodes a PNG blob into a standard Windows .ico file with PNG container
 */
export async function pngToIcoBlob(pngBlob: Blob, size: number): Promise<Blob> {
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

  const headerSize = 6;
  const dirEntrySize = 16;
  const buffer = new ArrayBuffer(headerSize + dirEntrySize + pngBytes.length);
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
  new Uint8Array(buffer).set(pngBytes, 22);

  return new Blob([buffer], { type: 'image/x-icon' });
}
