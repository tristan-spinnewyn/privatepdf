import JSZip from 'jszip';
import { downloadBlob, downloadPdf, downloadZip } from '../../utils/download';

describe('download utils', () => {
  let clicked: { href: string; download: string }[];

  beforeEach(() => {
    vi.useFakeTimers();
    clicked = [];
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.href, download: this.download });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('downloads a blob through a temporary link and revokes its URL later', () => {
    downloadBlob(new Blob(['x']), 'file.txt');

    expect(clicked).toEqual([{ href: 'blob:mock', download: 'file.txt' }]);
    expect(document.querySelector('a')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('downloads PDF bytes and appends the .pdf extension when missing', () => {
    downloadPdf(new Uint8Array([1, 2]), 'merged');
    downloadPdf(new Uint8Array([1, 2]), 'signed.pdf');

    expect(clicked.map((c) => c.download)).toEqual(['merged.pdf', 'signed.pdf']);
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/pdf');
  });

  it('zips files and downloads the archive with a .zip extension', async () => {
    vi.useRealTimers();
    await downloadZip([{ name: 'a.txt', blob: new Blob(['hello']) }], 'bundle');

    expect(clicked.map((c) => c.download)).toEqual(['bundle.zip']);
    const zipBlob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    expect(await zip.file('a.txt')!.async('string')).toBe('hello');
  });
});
