import { canvasToBlob, getCanvasContext } from '../../utils/canvas';

describe('canvasToBlob', () => {
  it('resolves with the encoded blob', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    const canvas = { toBlob: vi.fn((cb: BlobCallback) => cb(blob)) } as unknown as HTMLCanvasElement;

    await expect(canvasToBlob(canvas, 'image/png', 0.8)).resolves.toBe(blob);
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', 0.8);
  });

  it('rejects when the browser cannot encode the canvas', async () => {
    const canvas = { toBlob: (cb: BlobCallback) => cb(null) } as unknown as HTMLCanvasElement;

    await expect(canvasToBlob(canvas, 'image/avif')).rejects.toThrow('image/avif');
  });
});

describe('getCanvasContext', () => {
  it('returns the 2D context', () => {
    const ctx = {} as CanvasRenderingContext2D;
    const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement;
    expect(getCanvasContext(canvas)).toBe(ctx);
  });

  it('throws when no 2D context is available', () => {
    const canvas = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(() => getCanvasContext(canvas)).toThrow('Canvas 2D context unavailable');
  });
});
