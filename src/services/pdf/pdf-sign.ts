import { rgb, StandardFonts } from 'pdf-lib';
import { loadEditablePdf } from './pdf-loader';

export interface SignaturePlacementPercent {
  xPercent: number; // 0 to 100 relative to page width
  yPercent: number; // 0 to 100 relative to page height (top-to-bottom)
  widthPercent: number;
  heightPercent: number;
}

export interface DateStamp {
  text: string;
  xPercent: number;
  yPercent: number;
}

export async function signAndDatePdf(
  file: File,
  pageNumber: number, // 1-indexed
  signatureDataUrl: string,
  placement: SignaturePlacementPercent,
  dateStamp?: DateStamp
): Promise<Uint8Array> {
  const pdfDoc = await loadEditablePdf(file);
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
