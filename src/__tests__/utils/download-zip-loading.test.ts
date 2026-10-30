const jszipLoaded = vi.hoisted(() => vi.fn());

vi.mock('jszip', async (importOriginal) => {
  jszipLoaded();
  return importOriginal();
});

describe('downloadZip loading', () => {
  it('loads JSZip only when an archive is requested, keeping it out of every tool bundle', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { downloadZip } = await import('../../utils/download');
    expect(jszipLoaded).not.toHaveBeenCalled();

    await downloadZip([{ name: 'a.txt', blob: new Blob(['hello']) }], 'bundle');

    expect(jszipLoaded).toHaveBeenCalledTimes(1);
  });
});
