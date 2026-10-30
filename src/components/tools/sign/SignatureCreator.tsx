import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PenTool, Upload } from 'lucide-react';
import { SignaturePad } from './SignaturePad';

interface SignatureCreatorProps {
  signatureDataUrl: string | null;
  onSignatureChange: (signatureDataUrl: string | null) => void;
}

type CreationMode = 'draw' | 'upload';

/**
 * Lets the user draw a signature or upload a signature image
 */
export const SignatureCreator: React.FC<SignatureCreatorProps> = ({ signatureDataUrl, onSignatureChange }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<CreationMode>('draw');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onSignatureChange(event.target.result);
      }
    };
    reader.readAsDataURL(uploadedFile);
  };

  const tabClass = (tab: CreationMode) =>
    `px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
      mode === tab ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
    }`;

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <PenTool className="w-4 h-4 text-emerald-600" />
          <span>{t('tools.sign.signatureTitle')}</span>
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs">
          <button onClick={() => setMode('draw')} className={tabClass('draw')}>
            {t('tools.sign.tabDraw')}
          </button>
          <button onClick={() => setMode('upload')} className={tabClass('upload')}>
            {t('tools.sign.tabUpload')}
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <SignaturePad hasSignature={signatureDataUrl !== null} onSignatureChange={onSignatureChange} />
      ) : (
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleImageUpload}
            className="hidden"
            id="signature-upload"
          />
          <label
            htmlFor="signature-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
          >
            <Upload className="w-8 h-8 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-700">
              {t('tools.sign.uploadPlaceholder')}
            </span>
          </label>
        </div>
      )}
    </div>
  );
};
