# 🛡️ PrivatePDF — 100% Local & Private PDF Toolbox

A modern, fast, and fully client-side web application to perform common PDF operations directly inside your browser — **zero server uploads, zero third-party telemetry, 100% private**.

---

## 🔒 Why PrivatePDF?

Most free online PDF utilities (like Smallpdf or iLovePDF) upload your documents to remote cloud servers. For sensitive documents such as **pay slips, ID cards, bank statements, contracts, or tax declarations**, this poses a severe security and privacy risk.

**PrivatePDF runs entirely on your device:**
- 💻 **Client-Side Processing**: Operations are powered by WebAssembly & JavaScript (`pdf-lib` and `pdfjs-dist`).
- 📶 **Works 100% Offline**: Cut your internet connection or Wi-Fi, everything continues to work seamlessly.
- 🚀 **Zero Upload Delays**: No network bottlenecks, no file size caps, and no page limits.
- 🛡️ **Zero Data Leakage**: Your files never leave your computer.

---

## ✨ Features

1. **🔀 Merge PDFs**
   - Drag and drop multiple PDF files.
   - Reorder documents easily with up/down controls.
   - One-click instant merge and download.

2. **🔄 Organize & Rotate**
   - High-fidelity visual thumbnails of every page.
   - Rotate individual pages (+90° / -90°) or rotate all pages at once.
   - Delete unwanted pages or restore them with one click.
   - Reorder pages via left/right controls.

3. **✂️ Split & Extract**
   - Click directly on page thumbnails to select pages to extract.
   - Or enter custom page ranges (e.g. `1-3, 5, 8-10`) with real-time two-way synchronization.
   - Quick filters: *Select all*, *Deselect all*, *Even pages*, *Odd pages*.
   - Export extracted pages into a new PDF.

4. **✍️ Sign & Date**
   - Smooth freehand signature pad (touch, mouse, or stylus) with customizable pen colors (Black, Navy Blue, Royal Blue) and stroke thickness.
   - Option to import a transparent PNG signature.
   - Customizable date stamp (defaults to current date).
   - **Interactive on-page placement**: drag and resize your signature and date directly on top of the rendered PDF page before exporting.

5. **🖼️ Images to PDF**
   - Convert images (JPG, PNG, WebP) of receipts, invoices, or ID cards into standardized A4 PDFs.
   - Flexible orientation: Auto-detect based on photo aspect ratio, Portrait, or Landscape.
   - Margins: None (full bleed), Small (6mm), or Standard (12mm).

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Package Manager**: pnpm (fast, disk space efficient & secure dependency isolation)
- **PDF Engine**:
  - `pdf-lib`: Pure client-side PDF manipulation (merge, split, rotate, signature embedding, image conversion)
  - `pdfjs-dist`: Client-side rendering of page thumbnails via HTML5 canvas
- **Confetti**: `canvas-confetti`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Development Server
```bash
pnpm dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Automated Tests
```bash
pnpm test
```

### 4. Build for Production
```bash
pnpm build
```
The static build will be generated in `dist/`. It can be hosted on any static hosting service (Cloudflare Pages, GitHub Pages, Vercel, Netlify) or served locally.

---

## 📄 License

MIT
