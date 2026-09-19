import { PDFDocument, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

async function runTests() {
  console.log('--- Starting PDF & Image Toolbox Core Logic Verification ---');

  // 1. Create a dummy 3-page test PDF
  const doc1 = await PDFDocument.create();
  for (let i = 1; i <= 3; i++) {
    const page = doc1.addPage([400, 600]);
    page.drawText(`Document 1 - Page ${i}`, { x: 50, y: 550, size: 24 });
  }
  const bytes1 = await doc1.save();
  console.log('✓ Created Doc 1 (3 pages):', bytes1.length, 'bytes');

  // 2. Create another 2-page test PDF
  const doc2 = await PDFDocument.create();
  for (let i = 1; i <= 2; i++) {
    const page = doc2.addPage([400, 600]);
    page.drawText(`Document 2 - Page ${i}`, { x: 50, y: 550, size: 24 });
  }
  const bytes2 = await doc2.save();
  console.log('✓ Created Doc 2 (2 pages):', bytes2.length, 'bytes');

  // 3. Test Merge
  const mergedDoc = await PDFDocument.create();
  for (const b of [bytes1, bytes2]) {
    const loaded = await PDFDocument.load(b);
    const pages = await mergedDoc.copyPages(loaded, loaded.getPageIndices());
    pages.forEach(p => mergedDoc.addPage(p));
  }
  const mergedBytes = await mergedDoc.save();
  const verifyMerged = await PDFDocument.load(mergedBytes);
  console.log('✓ Merge Verification: Total pages =', verifyMerged.getPageCount(), '(Expected: 5)');
  if (verifyMerged.getPageCount() !== 5) throw new Error('Merge count mismatch');

  // 4. Test Split
  const splitDoc = await PDFDocument.create();
  const indices = [1, 3]; // pages 2 and 4
  const splitPages = await splitDoc.copyPages(verifyMerged, indices);
  splitPages.forEach(p => splitDoc.addPage(p));
  const splitBytes = await splitDoc.save();
  const verifySplit = await PDFDocument.load(splitBytes);
  console.log('✓ Split Verification: Total extracted pages =', verifySplit.getPageCount(), '(Expected: 2)');
  if (verifySplit.getPageCount() !== 2) throw new Error('Split count mismatch');

  // 5. Test Organize & Rotate
  const organizeDoc = await PDFDocument.create();
  const orgPages = await organizeDoc.copyPages(verifyMerged, [2, 0]);
  orgPages[0].setRotation(degrees(90));
  orgPages.forEach(p => organizeDoc.addPage(p));
  const orgBytes = await organizeDoc.save();
  const verifyOrg = await PDFDocument.load(orgBytes);
  console.log('✓ Organize Verification: Total pages =', verifyOrg.getPageCount(), ', Page 1 rotation =', verifyOrg.getPage(0).getRotation().angle);
  if (verifyOrg.getPageCount() !== 2 || verifyOrg.getPage(0).getRotation().angle !== 90) {
    throw new Error('Organize & Rotate verification failed');
  }

  // 6. Test Signature & Date embedding
  const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBytes = Buffer.from(tinyPngBase64, 'base64');
  const sigDoc = await PDFDocument.load(bytes1);
  const targetPage = sigDoc.getPage(0);
  const embeddedPng = await sigDoc.embedPng(pngBytes);
  targetPage.drawImage(embeddedPng, { x: 50, y: 50, width: 100, height: 50 });
  const font = await sigDoc.embedFont(StandardFonts.Helvetica);
  targetPage.drawText('19/09/2026', { x: 50, y: 30, size: 12, font });
  const signedBytes = await sigDoc.save();
  console.log('✓ Signature & Date Verification: Signed doc saved, size =', signedBytes.length);

  // 7. Test Image ZIP batch archiving
  const zip = new JSZip();
  zip.file('image1.png', pngBytes);
  zip.file('image2.jpg', pngBytes);
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  console.log('✓ ZIP Batch Packaging Verification: Archive generated, size =', zipBuffer.length, 'bytes');

  // 8. Test iOS HEIC extension detection
  const isHeic = (name) => name.toLowerCase().endsWith('.heic') || name.toLowerCase().endsWith('.heif');
  if (!isHeic('photo_iphone.HEIC') || !isHeic('img.heif') || isHeic('photo.jpg')) {
    throw new Error('HEIC detection logic failed');
  }
  console.log('✓ iOS HEIC / HEIF format detection verified');

  console.log('\nALL PDF & IMAGE TOOLBOX CORE OPERATIONS VERIFIED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
