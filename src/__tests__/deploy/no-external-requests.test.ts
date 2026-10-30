// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const EXTERNAL_URL = /https?:\/\/(?!www\.w3\.org\/)[^\s'"`)]+/g;

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === '__tests__' ? [] : listSourceFiles(path);
    return /\.(ts|tsx|css)$/.test(entry) ? [path] : [];
  });
}

describe('100% local guarantee', () => {
  it('does not reference any external origin from index.html', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8');
    expect(html.match(EXTERNAL_URL)).toBeNull();
  });

  it('does not reference any external origin from the application sources', () => {
    const offenders = listSourceFiles(resolve(root, 'src')).flatMap((file) =>
      (readFileSync(file, 'utf8').match(EXTERNAL_URL) ?? []).map((url) => `${file}: ${url}`)
    );
    expect(offenders).toEqual([]);
  });

  it('self-hosts the Plus Jakarta Sans font', () => {
    const entry = readFileSync(resolve(root, 'src/main.tsx'), 'utf8');
    expect(entry).toMatch(/import ['"]@fontsource\/plus-jakarta-sans/);
  });
});
