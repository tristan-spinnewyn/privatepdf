import { useEffect, useState } from 'react';
import type React from 'react';
import type { SignaturePlacementPercent } from '../services/pdf';

export type OverlayTarget = 'sig' | 'date';

export interface DatePlacement {
  xPercent: number;
  yPercent: number;
}

interface DragSession {
  target: OverlayTarget;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

// Signature height follows its width to keep a typical signature aspect ratio
const SIGNATURE_HEIGHT_RATIO = 0.45;

/**
 * Position of the signature and date overlays (in % of the page preview) and their mouse dragging
 */
export function useOverlayDrag(containerRef: React.RefObject<HTMLElement | null>) {
  const [sigPlacement, setSigPlacement] = useState<SignaturePlacementPercent>({
    xPercent: 60,
    yPercent: 75,
    widthPercent: 25,
    heightPercent: 10,
  });
  const [datePlacement, setDatePlacement] = useState<DatePlacement>({ xPercent: 60, yPercent: 71 });
  const [session, setSession] = useState<DragSession | null>(null);

  const startDrag = (target: OverlayTarget, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const initial = target === 'sig' ? sigPlacement : datePlacement;
    setSession({ target, startX: e.clientX, startY: e.clientY, initialX: initial.xPercent, initialY: initial.yPercent });
  };

  const resizeSignature = (widthPercent: number) => {
    setSigPlacement((prev) => ({
      ...prev,
      widthPercent,
      heightPercent: Math.round(widthPercent * SIGNATURE_HEIGHT_RATIO),
    }));
  };

  useEffect(() => {
    if (!session) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = session.initialX + ((e.clientX - session.startX) / rect.width) * 100;
      const y = session.initialY + ((e.clientY - session.startY) / rect.height) * 100;

      if (session.target === 'sig') {
        setSigPlacement((prev) => ({
          ...prev,
          xPercent: Math.max(0, Math.min(100 - prev.widthPercent, x)),
          yPercent: Math.max(0, Math.min(100 - prev.heightPercent, y)),
        }));
      } else {
        setDatePlacement({ xPercent: Math.max(0, Math.min(90, x)), yPercent: Math.max(0, Math.min(95, y)) });
      }
    };

    const handleMouseUp = () => setSession(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [session, containerRef]);

  return {
    sigPlacement,
    datePlacement,
    draggingTarget: session?.target ?? null,
    startDrag,
    resizeSignature,
  };
}
