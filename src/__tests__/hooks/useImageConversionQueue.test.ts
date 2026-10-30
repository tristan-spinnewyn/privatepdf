import { act, renderHook, waitFor } from '@testing-library/react';
import { useImageConversionQueue } from '../../hooks/useImageConversionQueue';
import { convertImage } from '../../services/image';

vi.mock('../../services/image', () => ({
  convertImage: vi.fn(),
  isHeicFile: (file: File) => file.name.endsWith('.heic'),
}));

describe('useImageConversionQueue', () => {
  beforeEach(() => {
    let counter = 0;
    URL.createObjectURL = vi.fn(() => `blob:${++counter}`);
    URL.revokeObjectURL = vi.fn();
    vi.mocked(convertImage).mockReset();
  });

  it('adds files with their source format and a preview (none for HEIC)', () => {
    const { result } = renderHook(() => useImageConversionQueue());

    act(() => result.current.addFiles([new File(['x'], 'a.png'), new File(['y'], 'b.heic')], 'webp'));

    expect(result.current.items.map((i) => [i.originalFormat, i.previewUrl, i.targetFormat])).toEqual([
      ['PNG', 'blob:1', 'webp'],
      ['HEIC (iOS)', '', 'webp'],
    ]);
  });

  it('changes target formats per item and globally', () => {
    const { result } = renderHook(() => useImageConversionQueue());
    act(() => result.current.addFiles([new File(['x'], 'a.png'), new File(['y'], 'b.png')], 'jpg'));

    act(() => result.current.setItemFormat(result.current.items[0].id, 'ico'));
    expect(result.current.items.map((i) => i.targetFormat)).toEqual(['ico', 'jpg']);

    act(() => result.current.setAllFormats('avif'));
    expect(result.current.items.map((i) => i.targetFormat)).toEqual(['avif', 'avif']);
  });

  it('removes one item or clears all, revoking their object URLs', () => {
    const { result } = renderHook(() => useImageConversionQueue());
    act(() => result.current.addFiles([new File(['x'], 'a.png'), new File(['y'], 'b.png')], 'jpg'));

    act(() => result.current.removeItem(result.current.items[0].id));
    expect(result.current.items).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');

    act(() => result.current.clearAll());
    expect(result.current.items).toEqual([]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:2');
  });

  it('converts every item and records successes and failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(convertImage)
      .mockResolvedValueOnce({ blob: new Blob(['abc']), width: 1, height: 1, filename: 'a.ico' })
      .mockRejectedValueOnce(new Error('nope'));
    const { result } = renderHook(() => useImageConversionQueue());
    act(() => result.current.addFiles([new File(['x'], 'a.png'), new File(['y'], 'b.png')], 'ico'));

    await act(() => result.current.convertAll({ quality: 0.8, scale: 1, icoSize: 32 }));

    await waitFor(() => expect(result.current.items[1].status).toBe('error'));
    expect(result.current.items[0]).toMatchObject({ status: 'done', name: 'a.ico', convertedSize: 3 });
    expect(result.current.doneItems).toHaveLength(1);
    expect(convertImage).toHaveBeenCalledWith(expect.any(File), {
      targetFormat: 'ico',
      quality: 0.8,
      scale: 1,
      icoSize: 32,
    });
  });
});
