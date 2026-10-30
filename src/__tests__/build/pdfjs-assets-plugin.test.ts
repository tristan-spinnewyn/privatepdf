// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { pdfjsAssets, resolvePdfjsAssetFile } from '../../../vite-plugins/pdfjs-assets';

type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

let packageDir: string;
const options = () => ({ packageDir, folders: ['cmaps', 'standard_fonts'], basePath: '/pdfjs/' });

beforeEach(() => {
  packageDir = mkdtempSync(join(tmpdir(), 'pdfjs-dist-'));
  mkdirSync(join(packageDir, 'cmaps'));
  mkdirSync(join(packageDir, 'standard_fonts'));
  mkdirSync(join(packageDir, 'build'));
  writeFileSync(join(packageDir, 'cmaps', 'UniJIS-UTF16-H.bcmap'), 'cmap');
  writeFileSync(join(packageDir, 'standard_fonts', 'FoxitSerif.pfb'), 'font');
  writeFileSync(join(packageDir, 'build', 'secret.js'), 'not an asset');
});

afterEach(() => {
  rmSync(packageDir, { recursive: true, force: true });
});

describe('resolvePdfjsAssetFile', () => {
  it('maps a public asset URL to the file inside the package', () => {
    expect(resolvePdfjsAssetFile('/pdfjs/cmaps/UniJIS-UTF16-H.bcmap?v=1', options())).toBe(
      join(packageDir, 'cmaps', 'UniJIS-UTF16-H.bcmap')
    );
  });

  it.each([
    '/other/cmaps/UniJIS-UTF16-H.bcmap',
    '/pdfjs/build/secret.js',
    '/pdfjs/cmaps/../build/secret.js',
    '/pdfjs/cmaps/%2e%2e%2fbuild%2fsecret.js',
    '/pdfjs/cmaps/missing.bcmap',
    '/pdfjs/cmaps/',
  ])('ignores %s', (url) => {
    expect(resolvePdfjsAssetFile(url, options())).toBeUndefined();
  });
});

describe('pdfjsAssets plugin', () => {
  it('emits every file of the configured folders into the build output', () => {
    const plugin = pdfjsAssets(options());
    const emitFile = vi.fn();

    (plugin.generateBundle as (this: unknown) => void).call({ emitFile });

    expect(emitFile).toHaveBeenCalledTimes(2);
    expect(emitFile).toHaveBeenCalledWith({
      type: 'asset',
      fileName: 'pdfjs/cmaps/UniJIS-UTF16-H.bcmap',
      source: Buffer.from('cmap'),
    });
    expect(emitFile).toHaveBeenCalledWith({
      type: 'asset',
      fileName: 'pdfjs/standard_fonts/FoxitSerif.pfb',
      source: Buffer.from('font'),
    });
  });

  describe('dev server middleware', () => {
    function installMiddleware(): Middleware {
      const use = vi.fn();
      const plugin = pdfjsAssets(options());
      (plugin.configureServer as (server: unknown) => void)({ middlewares: { use } });
      return use.mock.calls[0][0];
    }

    it('serves assets straight from the package', () => {
      const middleware = installMiddleware();
      const res = { setHeader: vi.fn(), end: vi.fn() };
      const next = vi.fn();

      middleware({ url: '/pdfjs/standard_fonts/FoxitSerif.pfb' } as IncomingMessage, res as unknown as ServerResponse, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
      expect(res.end).toHaveBeenCalledWith(Buffer.from('font'));
      expect(next).not.toHaveBeenCalled();
    });

    it('passes other requests through', () => {
      const middleware = installMiddleware();
      const next = vi.fn();

      middleware({ url: '/src/main.tsx' } as IncomingMessage, {} as ServerResponse, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
