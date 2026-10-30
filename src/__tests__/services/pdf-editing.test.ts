import { mergePdfs, organizePdf, splitPdf, signAndDatePdf } from '../../services/pdf';
import { createPdfFile, loadPdf, PNG_DATA_URL } from '../fixtures';

describe('mergePdfs', () => {
  it('concatenates every page of every file in order', async () => {
    const first = await createPdfFile(3, 'a.pdf', [100, 100]);
    const second = await createPdfFile(2, 'b.pdf', [200, 200]);

    const merged = await loadPdf(await mergePdfs([first, second]));

    expect(merged.getPageCount()).toBe(5);
    expect(merged.getPage(0).getWidth()).toBe(100);
    expect(merged.getPage(4).getWidth()).toBe(200);
  });
});

describe('organizePdf', () => {
  it('reorders, rotates and drops pages', async () => {
    const file = await createPdfFile(3);

    const result = await loadPdf(
      await organizePdf(file, [2, 0, 1], new Map([[2, 90]]), new Set([1]))
    );

    expect(result.getPageCount()).toBe(2);
    expect(result.getPage(0).getRotation().angle).toBe(90);
    expect(result.getPage(1).getRotation().angle).toBe(0);
  });

  it('rejects a document without any remaining page', async () => {
    const file = await createPdfFile(1);
    await expect(organizePdf(file, [0], new Map(), new Set([0]))).rejects.toThrow();
  });
});

describe('splitPdf', () => {
  it('extracts the requested 1-indexed pages', async () => {
    const file = await createPdfFile(5);
    const result = await loadPdf(await splitPdf(file, [2, 4, 99]));
    expect(result.getPageCount()).toBe(2);
  });

  it('rejects an empty selection', async () => {
    const file = await createPdfFile(2);
    await expect(splitPdf(file, [])).rejects.toThrow();
  });

  it('rejects a selection without any valid page', async () => {
    const file = await createPdfFile(2);
    await expect(splitPdf(file, [0, 7])).rejects.toThrow();
  });
});

describe('signAndDatePdf', () => {
  const placement = { xPercent: 60, yPercent: 75, widthPercent: 25, heightPercent: 10 };

  it('stamps the signature and the date on the requested page', async () => {
    const file = await createPdfFile(2);
    const original = new Uint8Array(await file.arrayBuffer());

    const signed = await signAndDatePdf(file, 2, PNG_DATA_URL, placement, {
      text: '30/10/2026',
      xPercent: 60,
      yPercent: 71,
    });

    expect((await loadPdf(signed)).getPageCount()).toBe(2);
    expect(signed.length).toBeGreaterThan(original.length);
  });

  it('skips a blank date stamp', async () => {
    const file = await createPdfFile(1);
    const withBlankDate = await signAndDatePdf(file, 1, PNG_DATA_URL, placement, {
      text: '   ',
      xPercent: 0,
      yPercent: 0,
    });
    const withoutDate = await signAndDatePdf(file, 1, PNG_DATA_URL, placement);

    expect(withBlankDate.length).toBe(withoutDate.length);
  });

  it('rejects a page outside the document', async () => {
    const file = await createPdfFile(1);
    await expect(signAndDatePdf(file, 3, PNG_DATA_URL, placement)).rejects.toThrow();
  });
});
