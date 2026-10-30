import { canvasToBmpBlob, pngToIcoBlob } from '../../services/image/image-encoders';

async function bytesOf(blob: Blob) {
  return new DataView(await blob.arrayBuffer());
}

describe('canvasToBmpBlob', () => {
  it('starts with the "BM" file signature', async () => {
    const canvas = {
      width: 1,
      height: 1,
      getContext: () => ({ getImageData: () => ({ data: new Uint8ClampedArray(4) }) }),
    } as unknown as HTMLCanvasElement;

    const view = await bytesOf(canvasToBmpBlob(canvas));

    expect(String.fromCharCode(view.getUint8(0), view.getUint8(1))).toBe('BM');
  });

  it('encodes RGBA pixels as a padded bottom-up 24-bit BMP', async () => {
    // 1x2 image: top pixel red, bottom pixel blue
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]);
    const canvas = {
      width: 1,
      height: 2,
      getContext: () => ({ getImageData: () => ({ data: pixels }) }),
    } as unknown as HTMLCanvasElement;

    const blob = canvasToBmpBlob(canvas);
    const view = await bytesOf(blob);

    expect(blob.type).toBe('image/bmp');
    expect(view.getInt32(18, true)).toBe(1);
    expect(view.getInt32(22, true)).toBe(2);
    expect(blob.size).toBe(54 + 4 * 2); // rows padded to 4 bytes
    // First stored row is the bottom (blue) pixel, in BGR order
    expect([view.getUint8(54), view.getUint8(55), view.getUint8(56)]).toEqual([255, 0, 0]);
    expect([view.getUint8(58), view.getUint8(59), view.getUint8(60)]).toEqual([0, 0, 255]);
  });
});

describe('pngToIcoBlob', () => {
  it('wraps the PNG payload in a single-image ICO container', async () => {
    const png = new Blob([new Uint8Array([1, 2, 3])]);

    const view = await bytesOf(await pngToIcoBlob(png, 32));

    expect(view.getUint16(2, true)).toBe(1); // icon type
    expect(view.getUint8(6)).toBe(32);
    expect(view.getUint32(14, true)).toBe(3);
    expect(view.getUint32(18, true)).toBe(22);
    expect([view.getUint8(22), view.getUint8(23), view.getUint8(24)]).toEqual([1, 2, 3]);
  });

  it('stores 256px icons with a 0 dimension byte', async () => {
    const view = await bytesOf(await pngToIcoBlob(new Blob([new Uint8Array([9])]), 256));
    expect(view.getUint8(6)).toBe(0);
    expect(view.getUint8(7)).toBe(0);
  });
});
