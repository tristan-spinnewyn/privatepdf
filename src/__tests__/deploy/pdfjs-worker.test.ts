// @vitest-environment node
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

describe('pdf.js worker', () => {
  it('is not vendored in public/, where it would drift from the installed pdfjs-dist version', () => {
    const publicDir = resolve(process.cwd(), 'public');
    const vendored = existsSync(publicDir) ? readdirSync(publicDir).filter((name) => /pdf\.worker/.test(name)) : [];
    expect(vendored).toEqual([]);
  });
});
