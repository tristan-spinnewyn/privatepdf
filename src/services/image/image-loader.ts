import heic2any from 'heic2any';

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
      throw new Error(`Could not decode HEIC image ${file.name}`);
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
      reject(new Error(`Failed to load image ${file.name}`));
    };
    img.src = url;
  });
}
