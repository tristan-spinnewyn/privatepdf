import { act, renderHook } from '@testing-library/react';
import { useToolFeedback } from '../../hooks/useToolFeedback';
import { EncryptedPdfError } from '../../services/pdf/pdf-errors';

describe('useToolFeedback', () => {
  it('shows one message at a time and resets both', () => {
    const { result } = renderHook(() => useToolFeedback());

    act(() => result.current.showError('boom'));
    expect(result.current).toMatchObject({ errorMessage: 'boom', successMessage: null });

    act(() => result.current.showSuccess('done'));
    expect(result.current).toMatchObject({ errorMessage: null, successMessage: 'done' });

    act(() => result.current.resetFeedback());
    expect(result.current).toMatchObject({ errorMessage: null, successMessage: null });
  });

  it('logs a processing error and shows a message that explains it when one exists', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useToolFeedback());
    const encrypted = new EncryptedPdfError('a.pdf');

    act(() => result.current.showProcessingError(encrypted, 'generic'));
    expect(result.current.errorMessage).toBe('"a.pdf" is password-protected or encrypted. Remove the protection, then try again.');
    expect(consoleError).toHaveBeenCalledWith(encrypted);

    act(() => result.current.showProcessingError(new Error('boom'), 'generic'));
    expect(result.current.errorMessage).toBe('generic');
    consoleError.mockRestore();
  });
});
