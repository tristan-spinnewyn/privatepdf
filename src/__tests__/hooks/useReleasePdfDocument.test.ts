import { renderHook } from '@testing-library/react';
import { useReleasePdfDocument } from '../../hooks/useReleasePdfDocument';
import { releasePdfDocument } from '../../services/pdf';
import { pdfFile } from '../components/test-utils';

vi.mock('../../services/pdf', () => ({ releasePdfDocument: vi.fn() }));

describe('useReleasePdfDocument', () => {
  it('releases the previous document when the file changes, and the last one on unmount', () => {
    const first = pdfFile('first.pdf');
    const second = pdfFile('second.pdf');
    const { rerender, unmount } = renderHook(({ file }: { file: File | null }) => useReleasePdfDocument(file), {
      initialProps: { file: first as File | null },
    });

    rerender({ file: first });
    expect(releasePdfDocument).not.toHaveBeenCalled();

    rerender({ file: second });
    expect(releasePdfDocument).toHaveBeenCalledExactlyOnceWith(first);

    rerender({ file: null });
    expect(releasePdfDocument).toHaveBeenLastCalledWith(second);

    unmount();
    expect(releasePdfDocument).toHaveBeenCalledTimes(2);
  });

  it('releases the open document when the tool unmounts', () => {
    const file = pdfFile();
    const { unmount } = renderHook(() => useReleasePdfDocument(file));

    unmount();

    expect(releasePdfDocument).toHaveBeenCalledExactlyOnceWith(file);
  });
});
