// pdf.js data files copied from the installed pdfjs-dist package and served from this origin,
// so rendering never depends on a third-party CDN (see vite-plugins/pdfjs-assets.ts).
export const PDFJS_ASSETS_BASE_PATH = '/pdfjs/';

export const PDFJS_ASSET_FOLDERS = {
  cMaps: 'cmaps',
  standardFonts: 'standard_fonts',
  wasm: 'wasm',
  iccs: 'iccs',
} as const;

export function pdfjsAssetUrl(folder: string): string {
  return `${PDFJS_ASSETS_BASE_PATH}${folder}/`;
}
