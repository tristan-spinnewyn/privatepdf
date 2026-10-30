import { computeTargetSize, convertImage } from '../../services/image';
import { loadImageElement } from '../../services/image/image-loader';

vi.mock('../../services/image/image-loader', () => ({
  loadImageElement: vi.fn(),
  isHeicFile: vi.fn(() => false),
}));

describe('computeTargetSize', () => {
  it('keeps the original size by default', () => {
    expect(computeTargetSize(800, 600, { targetFormat: 'png' })).toEqual({ width: 800, height: 600 });
  });

  it('uses a square icon size for ICO, defaulting to 64', () => {
    expect(computeTargetSize(800, 600, { targetFormat: 'ico', icoSize: 32 })).toEqual({ width: 32, height: 32 });
    expect(computeTargetSize(800, 600, { targetFormat: 'ico' })).toEqual({ width: 64, height: 64 });
  });

  it('applies the scale, then the max width and max height', () => {
    expect(computeTargetSize(800, 600, { targetFormat: 'jpg', scale: 0.5 })).toEqual({ width: 400, height: 300 });
    expect(computeTargetSize(800, 600, { targetFormat: 'jpg', maxWidth: 400 })).toEqual({ width: 400, height: 300 });
    expect(computeTargetSize(800, 600, { targetFormat: 'jpg', maxHeight: 300 })).toEqual({ width: 400, height: 300 });
  });

  it('ignores out-of-range scales', () => {
    expect(computeTargetSize(800, 600, { targetFormat: 'jpg', scale: 2 })).toEqual({ width: 800, height: 600 });
  });
});

describe('convertImage', () => {
  const ctx = { fillRect: vi.fn(), drawImage: vi.fn(), getImageData: vi.fn(), fillStyle: '' };
  let encodedMimes: string[];
  let unsupportedMimes: string[];

  beforeEach(() => {
    encodedMimes = [];
    unsupportedMimes = [];
    ctx.fillRect.mockClear();
    ctx.getImageData.mockReturnValue({ data: new Uint8ClampedArray(4 * 4) });
    vi.mocked(loadImageElement).mockResolvedValue({ naturalWidth: 4, naturalHeight: 1 } as HTMLImageElement);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb, mime = 'image/png') => {
      encodedMimes.push(mime);
      cb(unsupportedMimes.includes(mime) ? null : new Blob(['img'], { type: mime }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('encodes JPG on a filled background and renames the file', async () => {
    const result = await convertImage(new File(['x'], 'photo.heic'), { targetFormat: 'jpg' });

    expect(result.filename).toBe('photo.jpg');
    expect(result.blob.type).toBe('image/jpeg');
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(result).toMatchObject({ width: 4, height: 1 });
  });

  it('encodes WEBP without filling the background', async () => {
    const result = await convertImage(new File(['x'], 'photo.png'), { targetFormat: 'webp', quality: 0.5 });

    expect(result.filename).toBe('photo.webp');
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('falls back to WEBP when the browser cannot encode AVIF', async () => {
    unsupportedMimes = ['image/avif'];

    const result = await convertImage(new File(['x'], 'photo.png'), { targetFormat: 'avif' });

    expect(encodedMimes).toEqual(['image/avif', 'image/webp']);
    expect(result.blob.type).toBe('image/webp');
  });

  it('rejects when a non-AVIF format cannot be encoded', async () => {
    unsupportedMimes = ['image/png'];
    await expect(convertImage(new File(['x'], 'photo.jpg'), { targetFormat: 'png' })).rejects.toThrow();
  });

  it('encodes BMP and ICO with the dedicated encoders', async () => {
    const bmp = await convertImage(new File(['x'], 'photo.png'), { targetFormat: 'bmp' });
    const ico = await convertImage(new File(['x'], 'photo.png'), { targetFormat: 'ico', icoSize: 16 });

    expect(bmp.blob.type).toBe('image/bmp');
    expect(ico.blob.type).toBe('image/x-icon');
    expect(ico).toMatchObject({ filename: 'photo.ico', width: 16, height: 16 });
  });
});
