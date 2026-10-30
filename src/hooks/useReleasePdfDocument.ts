import { useEffect } from 'react';
import { releasePdfDocument } from '../services/pdf';

/**
 * Frees the pdf.js document of `file` once the tool switches to another file, clears it or unmounts
 */
export function useReleasePdfDocument(file: File | null) {
  useEffect(() => {
    if (!file) return;
    return () => {
      void releasePdfDocument(file);
    };
  }, [file]);
}
