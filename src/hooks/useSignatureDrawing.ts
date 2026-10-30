import { useRef } from 'react';
import type React from 'react';

interface SignatureDrawingOptions {
  penColor: string;
  penWidth: number;
  onChange: (signatureDataUrl: string | null) => void;
}

/**
 * Freehand drawing on a canvas pad; emits the signature as a PNG data URL when a stroke ends
 */
export function useSignatureDrawing({ penColor, penWidth, onChange }: SignatureDrawingOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const toCanvasPoint = (canvas: HTMLCanvasElement, e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = toCanvasPoint(canvas, e);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!isDrawingRef.current || !lastPointRef.current || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = toCanvasPoint(canvas, e);

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    lastPointRef.current = currentPoint;
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return { canvasRef, startDrawing, draw, stopDrawing, clear };
}
