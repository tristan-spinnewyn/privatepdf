import * as pdfjsLib from 'pdfjs-dist';
import {
  getPdfDocument,
  getPdfPageCount,
  releasePdfDocument,
  renderPageThumbnail,
  renderAllPageThumbnails,
  renderPageToCanvas,
  convertPdfToImages,
  downloadPdfImagesAsZip,
} from '../../services/pdf';
import { downloadZip } from '../../utils/download';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

// The worker URL comes from the installed pdfjs-dist package, so its version always matches the API
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/assets/pdf.worker.min-hash.mjs' }));

vi.mock('../../utils/download', () => ({
  downloadZip: vi.fn(),
}));

const render = vi.fn(() => ({ promise: Promise.resolve() }));

function mockPdf(numPages: number) {
  const page = {
    getViewport: ({ scale }: { scale: number }) => ({ width: 200 * scale, height: 300 * scale }),
    render,
  };
  // pdf.js 6 documents are destroyed through their loading task
  const doc = { numPages, getPage: vi.fn(async () => page), loadingTask: { destroy: vi.fn(async () => {}) } };
  vi.mocked(pdfjsLib.getDocument).mockReturnValue({ promise: Promise.resolve(doc) } as never);
  return doc;
}

let fileCounter = 0;
function uniquePdfFile() {
  fileCounter++;
  return new File([`pdf-${fileCounter}`], `doc-${fileCounter}.pdf`, { lastModified: fileCounter });
}

const ctx = { fillRect: vi.fn(), clearRect: vi.fn(), fillStyle: '' };

beforeEach(() => {
  vi.mocked(pdfjsLib.getDocument).mockReset();
  render.mockClear();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAAA');
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(new Blob(['img'])));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pdf document loader', () => {
  it('points pdf.js to the worker bundled from the installed pdfjs-dist package', () => {
    expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toBe('/assets/pdf.worker.min-hash.mjs');
  });

  it('loads a document once and reuses it for the same file', async () => {
    mockPdf(4);
    const file = uniquePdfFile();

    const first = await getPdfDocument(file);
    const second = await getPdfDocument(file);

    expect(first).toBe(second);
    expect(pdfjsLib.getDocument).toHaveBeenCalledTimes(1);
    expect(await getPdfPageCount(file)).toBe(4);
  });

  it('shares one loading task between concurrent loads of the same file', async () => {
    mockPdf(2);
    const file = uniquePdfFile();

    const [first, second] = await Promise.all([getPdfDocument(file), getPdfDocument(file)]);

    expect(first).toBe(second);
    expect(pdfjsLib.getDocument).toHaveBeenCalledTimes(1);
  });

  it('destroys a released document and loads it again on the next request', async () => {
    const doc = mockPdf(2);
    const file = uniquePdfFile();
    await getPdfDocument(file);

    await releasePdfDocument(file);

    expect(doc.loadingTask.destroy).toHaveBeenCalledTimes(1);
    await getPdfDocument(file);
    expect(pdfjsLib.getDocument).toHaveBeenCalledTimes(2);
  });

  it('destroys a document released while it is still loading', async () => {
    const doc = mockPdf(1);
    const file = uniquePdfFile();
    const loading = getPdfDocument(file);

    await releasePdfDocument(file);

    expect(await loading).toBe(doc);
    expect(doc.loadingTask.destroy).toHaveBeenCalledTimes(1);
  });

  it('ignores the release of a document that was never loaded or failed to load', async () => {
    vi.mocked(pdfjsLib.getDocument).mockReturnValue({ promise: Promise.reject(new Error('corrupt')) } as never);
    const file = uniquePdfFile();
    await expect(getPdfDocument(file)).rejects.toThrow('corrupt');

    await expect(releasePdfDocument(file)).resolves.toBeUndefined();
    await expect(releasePdfDocument(uniquePdfFile())).resolves.toBeUndefined();
  });

  it('loads cMaps, standard fonts, wasm decoders and ICC profiles from this origin', async () => {
    mockPdf(1);

    await getPdfDocument(uniquePdfFile());

    expect(pdfjsLib.getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
        iccUrl: '/pdfjs/iccs/',
      })
    );
  });
});

describe('pdf page renderer', () => {
  it('renders a thumbnail scaled to the target width', async () => {
    mockPdf(1);

    const thumb = await renderPageThumbnail(uniquePdfFile(), 1, 100);

    expect(thumb).toEqual({ dataUrl: 'data:image/png;base64,AAAA', width: 100, height: 150 });
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('renders thumbnails for every page', async () => {
    mockPdf(3);

    const thumbs = await renderAllPageThumbnails(uniquePdfFile(), 100);

    expect(thumbs.map((t) => t.pageNumber)).toEqual([1, 2, 3]);
  });

  it('renders a page into a given canvas with a default 1.5 scale', async () => {
    mockPdf(1);
    const canvas = document.createElement('canvas');

    const size = await renderPageToCanvas(uniquePdfFile(), 1, canvas);

    expect(size).toEqual({ width: 300, height: 450 });
    expect(canvas.width).toBe(300);
    expect(ctx.clearRect).toHaveBeenCalled();
  });

  it('renders a page into a canvas at the target width', async () => {
    mockPdf(1);
    const canvas = document.createElement('canvas');

    expect(await renderPageToCanvas(uniquePdfFile(), 1, canvas, 400)).toEqual({ width: 400, height: 600 });
  });
});

describe('convertPdfToImages', () => {
  it('converts every page and reports progress', async () => {
    mockPdf(2);
    const onProgress = vi.fn();

    const images = await convertPdfToImages(new File(['x'], 'report.pdf', { lastModified: 999 }), {
      format: 'jpg',
      scale: 1,
      onProgress,
    });

    expect(images.map((i) => i.filename)).toEqual(['report_page_1.jpg', 'report_page_2.jpg']);
    expect(images[0]).toMatchObject({ pageNumber: 1, width: 200, height: 300 });
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(onProgress).toHaveBeenLastCalledWith(2, 2);
  });

  it('defaults to a 2x scale', async () => {
    mockPdf(1);

    const [image] = await convertPdfToImages(uniquePdfFile(), { format: 'png' });

    expect(image.width).toBe(400);
  });

  it('zips the extracted images under the PDF base name', async () => {
    const blob = new Blob(['img']);
    await downloadPdfImagesAsZip(
      [{ pageNumber: 1, blob, filename: 'report_page_1.png', dataUrl: '', width: 1, height: 1 }],
      'report.pdf'
    );

    expect(downloadZip).toHaveBeenCalledWith([{ name: 'report_page_1.png', blob }], 'report_images.zip');
  });
});
