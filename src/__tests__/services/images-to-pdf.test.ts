import { computeImagePageLayout, imagesToPdf } from '../../services/pdf';
import { loadImageElement } from '../../services/image';
import { JPEG_BYTES, loadPdf } from '../fixtures';

vi.mock('../../services/image', () => ({
  loadImageElement: vi.fn(),
}));

const A4_SHORT = 595.28;
const A4_LONG = 841.89;

describe('computeImagePageLayout', () => {
  it('uses a landscape page for a landscape image in auto mode and centers it', () => {
    const layout = computeImagePageLayout(2000, 1000, { orientation: 'auto', margin: 'none' });

    expect(layout.pageWidth).toBe(A4_LONG);
    expect(layout.pageHeight).toBe(A4_SHORT);
    expect(layout.width).toBeCloseTo(A4_LONG);
    expect(layout.height).toBeCloseTo(A4_LONG / 2);
    expect(layout.y).toBeCloseTo((A4_SHORT - A4_LONG / 2) / 2);
  });

  it('honours forced orientations and margins', () => {
    const portrait = computeImagePageLayout(2000, 1000, { orientation: 'portrait', margin: 'normal' });
    expect(portrait.pageWidth).toBe(A4_SHORT);
    expect(portrait.x).toBe(36);
    expect(portrait.width).toBeCloseTo(A4_SHORT - 72);

    const landscape = computeImagePageLayout(1000, 2000, { orientation: 'landscape', margin: 'small' });
    expect(landscape.pageWidth).toBe(A4_LONG);
    expect(landscape.y).toBe(18);
  });

  it('uses a portrait page for a portrait image in auto mode', () => {
    const layout = computeImagePageLayout(1000, 2000, { orientation: 'auto', margin: 'none' });
    expect(layout.pageWidth).toBe(A4_SHORT);
    expect(layout.pageHeight).toBe(A4_LONG);
  });
});

describe('imagesToPdf', () => {
  beforeEach(() => {
    vi.mocked(loadImageElement).mockResolvedValue({ naturalWidth: 300, naturalHeight: 200 } as HTMLImageElement);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) =>
      cb(new Blob([JPEG_BYTES], { type: 'image/jpeg' }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates one A4 page per image', async () => {
    const files = [new File(['a'], 'a.png'), new File(['b'], 'b.heic')];

    const pdf = await loadPdf(await imagesToPdf(files));

    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(A4_LONG);
    expect(loadImageElement).toHaveBeenCalledTimes(2);
  });
});
