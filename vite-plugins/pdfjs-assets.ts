import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

export interface PdfjsAssetsOptions {
  /** Root directory of the installed pdfjs-dist package */
  packageDir: string;
  /** Package folders to expose (e.g. cmaps, standard_fonts) */
  folders: readonly string[];
  /** Public URL prefix, with leading and trailing slashes (e.g. /pdfjs/) */
  basePath: string;
}

function listFiles(dir: string): string[] {
  return readdirSync(dir).filter((name) => statSync(join(dir, name)).isFile());
}

/**
 * Maps a request URL such as /pdfjs/cmaps/Foo.bcmap to the matching file of the package.
 * Only plain file names inside the configured folders resolve, so nothing else can be read.
 */
export function resolvePdfjsAssetFile(url: string, options: PdfjsAssetsOptions): string | undefined {
  const pathname = url.split('?')[0];
  if (!pathname.startsWith(options.basePath)) return undefined;

  const [folder, fileName, ...rest] = pathname.slice(options.basePath.length).split('/');
  if (rest.length > 0 || !options.folders.includes(folder) || !/^[\w.-]+$/.test(fileName ?? '')) return undefined;
  if (fileName.startsWith('.')) return undefined;

  const file = join(options.packageDir, folder, fileName);
  return existsSync(file) ? file : undefined;
}

/**
 * Serves pdf.js data files (cMaps, standard fonts, wasm decoders, ICC profiles) from the
 * installed pdfjs-dist package: straight from node_modules in dev, copied into the build output.
 */
export function pdfjsAssets(options: PdfjsAssetsOptions): Plugin {
  return {
    name: 'pdfjs-assets',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = req.url ? resolvePdfjsAssetFile(req.url, options) : undefined;
        if (!file) return next();
        res.setHeader('Content-Type', 'application/octet-stream');
        res.end(readFileSync(file));
      });
    },

    generateBundle() {
      for (const folder of options.folders) {
        const dir = join(options.packageDir, folder);
        for (const fileName of listFiles(dir)) {
          this.emitFile({
            type: 'asset',
            fileName: `${options.basePath.slice(1)}${folder}/${fileName}`,
            source: readFileSync(join(dir, fileName)),
          });
        }
      }
    },
  };
}
