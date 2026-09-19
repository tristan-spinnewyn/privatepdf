import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  return await mergedPdf.save();
}

export async function organizePdf(
  file: File,
  pageOrder: number[], // 0-indexed original page indices
  rotations: Map<number, number>, // original index -> additional degrees (e.g. 90, 180, 270)
  deletedPages: Set<number> // original 0-indexed
): Promise<Uint8Array> {
  const originalPdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const validIndices = pageOrder.filter(idx => !deletedPages.has(idx));
  if (validIndices.length === 0) {
    throw new Error('Le document résultant ne contient aucune page.');
  }

  const copiedPages = await newPdf.copyPages(originalPdf, validIndices);

  copiedPages.forEach((page, i) => {
    const originalIndex = validIndices[i];
    const addRotation = rotations.get(originalIndex) || 0;
    if (addRotation !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + addRotation) % 360));
    }
    newPdf.addPage(page);
  });

  return await newPdf.save();
}

export async function splitPdf(file: File, pageNumbers: number[]): Promise<Uint8Array> {
  // pageNumbers is 1-indexed
  if (!pageNumbers.length) {
    throw new Error('Veuillez sélectionner au moins une page.');
  }

  const originalPdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const indices = pageNumbers
    .map(p => p - 1)
    .filter(idx => idx >= 0 && idx < originalPdf.getPageCount());

  if (!indices.length) {
    throw new Error('Aucune page valide sélectionnée.');
  }

  const copiedPages = await newPdf.copyPages(originalPdf, indices);
  copiedPages.forEach(page => newPdf.addPage(page));

  return await newPdf.save();
}

export async function signAndDatePdf(
  file: File,
  pageNumber: number, // 1-indexed
  signatureDataUrl: string,
  placement: {
    xPercent: number; // 0 to 100 relative to page width
    yPercent: number; // 0 to 100 relative to page height (top-to-bottom)
    widthPercent: number;
    heightPercent: number;
  },
  dateStamp?: {
    text: string;
    xPercent: number;
    yPercent: number;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const pageIndex = pageNumber - 1;

  if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
    throw new Error('Page introuvable');
  }

  const page = pdfDoc.getPage(pageIndex);
  const { width: pageWidth, height: pageHeight } = page.getSize();

  // Convert base64 data URL to Uint8Array
  const pngResponse = await fetch(signatureDataUrl);
  const pngBytes = await pngResponse.arrayBuffer();
  const pngImage = await pdfDoc.embedPng(pngBytes);

  // Compute position (PDF coordinate system has (0,0) at bottom-left)
  const imgWidth = (placement.widthPercent / 100) * pageWidth;
  const imgHeight = (placement.heightPercent / 100) * pageHeight;
  const imgX = (placement.xPercent / 100) * pageWidth;
  const imgY = pageHeight - ((placement.yPercent / 100) * pageHeight) - imgHeight;

  page.drawImage(pngImage, {
    x: Math.max(0, imgX),
    y: Math.max(0, imgY),
    width: imgWidth,
    height: imgHeight,
  });

  // Optional date stamp
  if (dateStamp && dateStamp.text.trim()) {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 11;
    const textWidth = font.widthOfTextAtSize(dateStamp.text, fontSize);
    const dateX = (dateStamp.xPercent / 100) * pageWidth;
    const dateY = pageHeight - ((dateStamp.yPercent / 100) * pageHeight) - fontSize;

    // Draw small white badge behind date for contrast
    page.drawRectangle({
      x: Math.max(0, dateX - 4),
      y: Math.max(0, dateY - 2),
      width: textWidth + 8,
      height: fontSize + 6,
      color: rgb(1, 1, 1),
      opacity: 0.85,
    });

    page.drawText(dateStamp.text, {
      x: Math.max(0, dateX),
      y: Math.max(0, dateY),
      size: fontSize,
      font: font,
      color: rgb(0.1, 0.1, 0.2),
    });
  }

  return await pdfDoc.save();
}

/**
 * Converts any image file (PNG, JPG, WebP) to JPEG / PNG Uint8Array supported by pdf-lib
 */
async function processImageForPdf(file: File): Promise<{ bytes: Uint8Array; format: 'png' | 'jpeg'; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Erreur canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      // Export as JPEG with 90% quality
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Conversion image échouée'));
          return;
        }
        blob.arrayBuffer().then(buffer => {
          resolve({
            bytes: new Uint8Array(buffer),
            format: 'jpeg',
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        });
      }, 'image/jpeg', 0.90);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Impossible de charger l'image ${file.name}`));
    };
    img.src = url;
  });
}

export async function imagesToPdf(
  files: File[],
  options: {
    orientation: 'auto' | 'portrait' | 'landscape';
    margin: 'none' | 'small' | 'normal';
  } = { orientation: 'auto', margin: 'normal' }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 standard measurements in points (72 points = 1 inch)
  const A4_SHORT = 595.28;
  const A4_LONG = 841.89;

  const marginMap = {
    none: 0,
    small: 18, // 0.25 in
    normal: 36, // 0.5 in
  };
  const m = marginMap[options.margin];

  for (const file of files) {
    const processed = await processImageForPdf(file);
    const embeddedImage = await pdfDoc.embedJpg(processed.bytes);

    let pageWidth = A4_SHORT;
    let pageHeight = A4_LONG;

    const isImageLandscape = processed.width > processed.height;

    if (options.orientation === 'landscape') {
      pageWidth = A4_LONG;
      pageHeight = A4_SHORT;
    } else if (options.orientation === 'auto') {
      if (isImageLandscape) {
        pageWidth = A4_LONG;
        pageHeight = A4_SHORT;
      } else {
        pageWidth = A4_SHORT;
        pageHeight = A4_LONG;
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const usableWidth = pageWidth - (m * 2);
    const usableHeight = pageHeight - (m * 2);

    // Compute aspect-ratio scale
    const scaleFactor = Math.min(
      usableWidth / processed.width,
      usableHeight / processed.height
    );

    const drawWidth = processed.width * scaleFactor;
    const drawHeight = processed.height * scaleFactor;

    // Center on page
    const x = m + (usableWidth - drawWidth) / 2;
    const y = m + (usableHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}

export function downloadPdf(data: Uint8Array, filename: string) {
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 o';
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
