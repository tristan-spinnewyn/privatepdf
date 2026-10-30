import { act, renderHook } from '@testing-library/react';
import { useToolFeedback } from '../../hooks/useToolFeedback';

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
});
