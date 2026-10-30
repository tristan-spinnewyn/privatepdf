import { ensureExtension, stripExtension } from '../../utils/file-name';

describe('stripExtension', () => {
  it('removes the last extension', () => {
    expect(stripExtension('report.final.pdf')).toBe('report.final');
  });

  it('keeps names without extension', () => {
    expect(stripExtension('README')).toBe('README');
  });
});

describe('ensureExtension', () => {
  it('appends the extension when missing', () => {
    expect(ensureExtension('merged', 'pdf')).toBe('merged.pdf');
  });

  it('keeps the name when the extension is already there', () => {
    expect(ensureExtension('archive.zip', 'zip')).toBe('archive.zip');
  });
});
