/**
 * Images above this pixel count are refused: decoding and drawing them would need several
 * hundred megabytes of canvas memory and crash the tab (canvas limits are lower still on iOS)
 */
export const MAX_IMAGE_PIXELS = 100_000_000;

/**
 * Raised for images with more pixels than the browser can safely process
 */
export class ImageTooLargeError extends Error {
  readonly fileName: string;

  constructor(fileName: string) {
    super(`${fileName} exceeds ${MAX_IMAGE_PIXELS} pixels`);
    this.name = 'ImageTooLargeError';
    this.fileName = fileName;
  }
}
