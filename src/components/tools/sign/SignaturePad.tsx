import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eraser } from 'lucide-react';
import { useSignatureDrawing } from '../../../hooks/useSignatureDrawing';

interface SignaturePadProps {
  hasSignature: boolean;
  onSignatureChange: (signatureDataUrl: string | null) => void;
}

const PEN_COLORS = [
  { color: '#000000', label: 'Noir / Black' },
  { color: '#1e3a8a', label: 'Bleu marine / Navy' },
  { color: '#2563eb', label: 'Bleu roi / Blue' },
];

export const SignaturePad: React.FC<SignaturePadProps> = ({ hasSignature, onSignatureChange }) => {
  const { t } = useTranslation();
  const [penColor, setPenColor] = useState('#1e3a8a');
  const [penWidth, setPenWidth] = useState(3);
  const { canvasRef, startDrawing, draw, stopDrawing, clear } = useSignatureDrawing({
    penColor,
    penWidth,
    onChange: onSignatureChange,
  });

  const penWidths = [
    { width: 2, label: t('tools.sign.thin') },
    { width: 3.5, label: t('tools.sign.medium') },
    { width: 5, label: t('tools.sign.thick') },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {/* Colors */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">{t('tools.sign.color')}</span>
          {PEN_COLORS.map((c) => (
            <button
              key={c.color}
              onClick={() => setPenColor(c.color)}
              style={{ backgroundColor: c.color }}
              title={c.label}
              className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                penColor === c.color ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100'
              }`}
            />
          ))}
        </div>

        {/* Pen thickness */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
          {penWidths.map((item) => (
            <button
              key={item.width}
              onClick={() => setPenWidth(item.width)}
              className={`px-2 py-0.5 rounded-md font-medium cursor-pointer transition-colors ${
                penWidth === item.width
                  ? 'bg-white shadow-xs text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Clear button */}
        <button
          onClick={clear}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>{t('tools.sign.clear')}</span>
        </button>
      </div>

      {/* Canvas Pad */}
      <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 relative overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={180}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className="w-full h-40 cursor-crosshair bg-transparent"
        />
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
            {t('tools.sign.drawPlaceholder')}
          </div>
        )}
      </div>
    </div>
  );
};
