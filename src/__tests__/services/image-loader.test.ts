import { heicTo } from 'heic-to/csp';
import { isHeicFile, loadImageElement } from '../../services/image';
import { ImageTooLargeError } from '../../services/image/image-errors';

// The CSP-safe build: the default heic-to build needs 'unsafe-eval' (Emscripten embind)
vi.mock('heic-to/csp', () => ({ heicTo: vi.fn() }));

describe('isHeicFile', () => {
  it('detects iOS HEIC / HEIF files by extension or MIME type', () => {
    expect(isHeicFile(new File([''], 'IMG_0001.HEIC'))).toBe(true);
    expect(isHeicFile(new File([''], 'photo.heif'))).toBe(true);
    expect(isHeicFile(new File([''], 'photo', { type: 'image/heic' }))).toBe(true);
    expect(isHeicFile(new File([''], 'photo.jpg', { type: 'image/jpeg' }))).toBe(false);
  });
});

describe('loadImageElement', () => {
  let imageBehaviour: 'load' | 'error';
  let loadedSources: string[];

  beforeEach(() => {
    imageBehaviour = 'load';
    loadedSources = [];
    URL.createObjectURL = vi.fn(() => 'blob:image');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (this: HTMLImageElement, value: string) {
      loadedSources.push(value);
      const handler = imageBehaviour === 'load' ? this.onload : this.onerror;
      queueMicrotask(() => handler?.call(this, new Event(imageBehaviour)));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads a regular image and revokes its object URL', async () => {
    const img = await loadImageElement(new File(['x'], 'photo.png'));

    expect(img).toBeInstanceOf(HTMLImageElement);
    expect(loadedSources).toEqual(['blob:image']);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:image');
    expect(heicTo).not.toHaveBeenCalled();
  });

  it('rejects when the image cannot be decoded', async () => {
    imageBehaviour = 'error';
    await expect(loadImageElement(new File(['x'], 'broken.png'))).rejects.toThrow('Failed to load image broken.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:image');
  });

  it('rejects images over 100 megapixels before any canvas is allocated for them', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(20_000);
    vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(5_001);

    await expect(loadImageElement(new File(['x'], 'bomb.png'))).rejects.toBeInstanceOf(ImageTooLargeError);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:image');
  });

  it('accepts an image of exactly 100 megapixels', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(20_000);
    vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(5_000);

    await expect(loadImageElement(new File(['x'], 'big.png'))).resolves.toBeInstanceOf(HTMLImageElement);
  });

  it('converts HEIC files to JPEG before loading them', async () => {
    const jpeg = new Blob(['jpeg'], { type: 'image/jpeg' });
    vi.mocked(heicTo).mockResolvedValue(jpeg);
    const heic = new File(['x'], 'IMG_1.heic');

    await loadImageElement(heic);

    expect(heicTo).toHaveBeenCalledWith(expect.objectContaining({ blob: heic, type: 'image/jpeg' }));
    expect(URL.createObjectURL).toHaveBeenCalledWith(jpeg);
  });

  it('rejects with the file name when HEIC decoding fails', async () => {
    vi.mocked(heicTo).mockRejectedValue(new Error('bad heic'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(loadImageElement(new File(['x'], 'IMG_2.heic'))).rejects.toThrow('Could not decode HEIC image IMG_2.heic');
  });
});
