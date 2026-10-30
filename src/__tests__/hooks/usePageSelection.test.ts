import { act, renderHook } from '@testing-library/react';
import { usePageSelection } from '../../hooks/usePageSelection';

describe('usePageSelection', () => {
  it('keeps the selection and the range input in sync', () => {
    const { result } = renderHook(() => usePageSelection(6));

    act(() => result.current.selectPages(new Set([1])));
    act(() => result.current.togglePage(2));
    act(() => result.current.togglePage(4));
    expect(result.current.rangeInput).toBe('1-2, 4');

    act(() => result.current.togglePage(1));
    expect([...result.current.selectedPages]).toEqual([2, 4]);
    expect(result.current.rangeInput).toBe('2, 4');
  });

  it('selects all, none, odd and even pages', () => {
    const { result } = renderHook(() => usePageSelection(5));

    act(() => result.current.selectAll());
    expect(result.current.rangeInput).toBe('1-5');

    act(() => result.current.selectOdd());
    expect(result.current.rangeInput).toBe('1, 3, 5');

    act(() => result.current.selectEven());
    expect(result.current.rangeInput).toBe('2, 4');

    act(() => result.current.selectNone());
    expect(result.current.selectedPages.size).toBe(0);
    expect(result.current.rangeInput).toBe('');
  });

  it('parses a typed range while keeping the raw input', () => {
    const { result } = renderHook(() => usePageSelection(10));

    act(() => result.current.changeRangeInput('2-3, 9'));

    expect(result.current.rangeInput).toBe('2-3, 9');
    expect([...result.current.selectedPages].sort()).toEqual([2, 3, 9]);
  });
});
