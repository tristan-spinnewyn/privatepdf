import { dirname } from 'node:path'
import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { pdfjsAssets } from './vite-plugins/pdfjs-assets.ts'
import { PDFJS_ASSETS_BASE_PATH, PDFJS_ASSET_FOLDERS } from './src/config/pdfjs-assets.ts'

const require = createRequire(import.meta.url)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    pdfjsAssets({
      packageDir: dirname(require.resolve('pdfjs-dist/package.json')),
      folders: Object.values(PDFJS_ASSET_FOLDERS),
      basePath: PDFJS_ASSETS_BASE_PATH,
    }),
  ],
})
