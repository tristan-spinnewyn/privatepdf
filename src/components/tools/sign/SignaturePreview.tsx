import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Move, PenTool } from 'lucide-react';
import type { SignaturePlacementPercent } from '../../../services/pdf';
import type { DatePlacement, OverlayTarget } from '../../../hooks/useOverlayDrag';

interface SignaturePreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isRendering: boolean;
  currentPage: number;
  signatureDataUrl: string | null;
  sigPlacement: SignaturePlacementPercent;
  dateText: string | null; // null when no date is stamped
  datePlacement: DatePlacement;
  draggingTarget: OverlayTarget | null;
  onStartDrag: (target: OverlayTarget, e: React.MouseEvent) => void;
}

/**
 * Rendered PDF page with the draggable signature and date overlays
 */
export const SignaturePreview: React.FC<SignaturePreviewProps> = ({
  canvasRef,
  containerRef,
  isRendering,
  currentPage,
  signatureDataUrl,
  sigPlacement,
  dateText,
  datePlacement,
  draggingTarget,
  onStartDrag,
}) => {
  const { t } = useTranslation();

  return (
    <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Move className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('tools.sign.dragHelp')}</span>
        </div>
        <span>{t('tools.organize.page')} {currentPage}</span>
      </div>

      {/* Container for PDF Canvas + Interactive Draggable Overlays */}
      <div
        ref={containerRef}
        className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-100 shadow-md select-none max-w-full"
      >
        {isRendering && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-30">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        )}

        {/* PDF Document Canvas */}
        <canvas ref={canvasRef} className="block max-w-full h-auto" />

        {/* Draggable Signature Overlay */}
        {signatureDataUrl && (
          <div
            onMouseDown={(e) => onStartDrag('sig', e)}
            style={{
              left: `${sigPlacement.xPercent}%`,
              top: `${sigPlacement.yPercent}%`,
              width: `${sigPlacement.widthPercent}%`,
              height: `${sigPlacement.heightPercent}%`,
            }}
            className={`absolute z-20 border-2 border-emerald-500 bg-emerald-500/10 rounded-lg cursor-grab active:cursor-grabbing flex items-center justify-center group transition-shadow ${
              draggingTarget === 'sig' ? 'ring-4 ring-emerald-500/30 shadow-lg' : 'hover:border-emerald-600'
            }`}
          >
            <img
              src={signatureDataUrl}
              alt="Signature"
              className="w-full h-full object-contain pointer-events-none p-1"
            />
            <div className="absolute -top-5 left-0 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none flex items-center gap-1">
              <PenTool className="w-2.5 h-2.5" />
              <span>Signature</span>
            </div>
          </div>
        )}

        {/* Draggable Date Overlay */}
        {dateText && (
          <div
            onMouseDown={(e) => onStartDrag('date', e)}
            style={{
              left: `${datePlacement.xPercent}%`,
              top: `${datePlacement.yPercent}%`,
            }}
            className={`absolute z-20 px-2 py-0.5 bg-white/90 border border-emerald-400 rounded-md shadow-xs text-[11px] font-bold text-slate-800 cursor-grab active:cursor-grabbing select-none group ${
              draggingTarget === 'date' ? 'ring-2 ring-emerald-500' : 'hover:border-emerald-600'
            }`}
          >
            {dateText}
            <div className="absolute -top-4 left-0 bg-slate-700 text-white text-[8px] font-bold px-1 rounded pointer-events-none">
              Date
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
