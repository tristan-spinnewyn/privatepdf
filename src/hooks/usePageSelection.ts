import { useState } from 'react';
import { formatPageRange, parsePageRange } from '../utils/page-range';

/**
 * Selected pages of a document, kept in sync with an editable range string ("1-3, 5")
 */
export function usePageSelection(totalPages: number) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState('');

  const selectPages = (pages: Set<number>) => {
    setSelectedPages(pages);
    setRangeInput(formatPageRange(pages));
  };

  const allPageNumbers = () => Array.from({ length: totalPages }, (_, i) => i + 1);

  const togglePage = (pageNumber: number) => {
    const next = new Set(selectedPages);
    if (next.has(pageNumber)) {
      next.delete(pageNumber);
    } else {
      next.add(pageNumber);
    }
    selectPages(next);
  };

  const selectAll = () => selectPages(new Set(allPageNumbers()));
  const selectNone = () => selectPages(new Set());
  const selectEven = () => selectPages(new Set(allPageNumbers().filter((n) => n % 2 === 0)));
  const selectOdd = () => selectPages(new Set(allPageNumbers().filter((n) => n % 2 === 1)));

  const changeRangeInput = (value: string) => {
    setRangeInput(value);
    setSelectedPages(parsePageRange(value, totalPages));
  };

  return {
    selectedPages,
    rangeInput,
    selectPages,
    togglePage,
    selectAll,
    selectNone,
    selectEven,
    selectOdd,
    changeRangeInput,
  };
}
