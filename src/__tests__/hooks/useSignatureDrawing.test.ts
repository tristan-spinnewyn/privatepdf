import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { useSignatureDrawing } from '../../hooks/useSignatureDrawing';

function pointer(clientX: number, clientY: number) {
  return { clientX, clientY, pointerId: 1 } as React.PointerEvent<HTMLCanvasElement>;
}

describe('useSignatureDrawing', () => {
  const ctx = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
  };

  function setup() {
    const onChange = vi.fn();
    const canvas = document.createElement('canvas');
    canvas.setPointerCapture = vi.fn();
    canvas.getBoundingClientRect = () => ({ left: 10, top: 20 }) as DOMRect;
    canvas.getContext = vi.fn(() => ctx) as unknown as HTMLCanvasElement['getContext'];
    canvas.toDataURL = () => 'data:image/png;base64,SIG';

    const hook = renderHook(() => useSignatureDrawing({ penColor: '#000000', penWidth: 3, onChange }));
    hook.result.current.canvasRef.current = canvas;
    return { ...hook, onChange };
  }

  beforeEach(() => vi.clearAllMocks());

  it('draws strokes relative to the canvas and emits the signature on release', () => {
    const { result, onChange } = setup();

    act(() => result.current.startDrawing(pointer(15, 25)));
    act(() => result.current.draw(pointer(30, 40)));
    act(() => result.current.stopDrawing());

    expect(ctx.moveTo).toHaveBeenCalledWith(5, 5);
    expect(ctx.lineTo).toHaveBeenCalledWith(20, 20);
    expect(ctx.strokeStyle).toBe('#000000');
    expect(onChange).toHaveBeenCalledWith('data:image/png;base64,SIG');
  });

  it('ignores moves and releases when not drawing', () => {
    const { result, onChange } = setup();

    act(() => result.current.draw(pointer(30, 40)));
    act(() => result.current.stopDrawing());

    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears the pad and the signature', () => {
    const { result, onChange } = setup();

    act(() => result.current.clear());

    expect(ctx.clearRect).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
