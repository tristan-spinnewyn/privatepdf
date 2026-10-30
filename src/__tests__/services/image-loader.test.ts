import heic2any from 'heic2any';
import { isHeicFile, loadImageElement } from '../../services/image';

vi.mock('heic2any', () => ({ default: vi.fn() }));

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
    expect(heic2any).not.toHaveBeenCalled();
  });

  it('rejects when the image cannot be decoded', async () => {
    imageBehaviour = 'error';
    await expect(loadImageElement(new File(['x'], 'broken.png'))).rejects.toThrow('broken.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:image');
  });

  it('converts HEIC files to JPEG before loading them', async () => {
    const jpeg = new Blob(['jpeg'], { type: 'image/jpeg' });
    vi.mocked(heic2any).mockResolvedValue([jpeg]);

    await loadImageElement(new File(['x'], 'IMG_1.heic'));

    expect(heic2any).toHaveBeenCalledWith(expect.objectContaining({ toType: 'image/jpeg' }));
    expect(URL.createObjectURL).toHaveBeenCalledWith(jpeg);
  });

  it('rejects with the file name when HEIC decoding fails', async () => {
    vi.mocked(heic2any).mockRejectedValue(new Error('bad heic'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(loadImageElement(new File(['x'], 'IMG_2.heic'))).rejects.toThrow('IMG_2.heic');
  });
});
