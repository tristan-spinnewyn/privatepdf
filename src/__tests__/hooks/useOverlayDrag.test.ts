import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { useOverlayDrag } from '../../hooks/useOverlayDrag';

function mouseDown(clientX: number, clientY: number) {
  return { clientX, clientY, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as React.MouseEvent;
}

function setup() {
  const container = document.createElement('div');
  container.getBoundingClientRect = () => ({ width: 200, height: 100 }) as DOMRect;
  const containerRef = { current: container };
  return renderHook(() => useOverlayDrag(containerRef));
}

describe('useOverlayDrag', () => {
  it('starts with the default placements', () => {
    const { result } = setup();
    expect(result.current.sigPlacement).toEqual({ xPercent: 60, yPercent: 75, widthPercent: 25, heightPercent: 10 });
    expect(result.current.datePlacement).toEqual({ xPercent: 60, yPercent: 71 });
  });

  it('drags the signature within the preview bounds', () => {
    const { result } = setup();

    act(() => result.current.startDrag('sig', mouseDown(0, 0)));
    expect(result.current.draggingTarget).toBe('sig');

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: -200 }));
    });
    expect(result.current.sigPlacement).toMatchObject({ xPercent: 70, yPercent: 0 });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 0 }));
    });
    expect(result.current.sigPlacement.xPercent).toBe(75); // 100 - widthPercent

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
    expect(result.current.draggingTarget).toBeNull();
  });

  it('drags the date stamp within its own bounds', () => {
    const { result } = setup();

    act(() => result.current.startDrag('date', mouseDown(0, 0)));
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }));
    });

    expect(result.current.datePlacement).toEqual({ xPercent: 90, yPercent: 95 });
  });

  it('resizes the signature keeping its aspect ratio', () => {
    const { result } = setup();

    act(() => result.current.resizeSignature(40));

    expect(result.current.sigPlacement).toMatchObject({ widthPercent: 40, heightPercent: 18 });
  });
});
