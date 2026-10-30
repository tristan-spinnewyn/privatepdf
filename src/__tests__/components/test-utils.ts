import { fireEvent } from '@testing-library/react';

export function pdfFile(name = 'report.pdf', content = 'pdf') {
  return new File([content], name, { type: 'application/pdf' });
}

export function imageFile(name = 'photo.png') {
  return new File(['img'], name, { type: 'image/png' });
}

/**
 * Selects files through a (hidden) file input
 */
export function selectFiles(input: Element, files: File[]) {
  fireEvent.change(input, { target: { files } });
}

export function fileInputs(container: HTMLElement) {
  return Array.from(container.querySelectorAll('input[type="file"]'));
}
