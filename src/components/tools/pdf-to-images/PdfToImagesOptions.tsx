import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PdfImageFormat } from '../../../services/pdf';

interface PdfToImagesOptionsProps {
  format: PdfImageFormat;
  onFormatChange: (format: PdfImageFormat) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
}

export const PdfToImagesOptions: React.FC<PdfToImagesOptionsProps> = ({
  format,
  onFormatChange,
  scale,
  onScaleChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <label className="block text-[11px] font-bold text-slate-500 mb-1">
          {t('tools.pdfToImages.imageFormat')}
        </label>
        <select
          value={format}
          onChange={(e) => onFormatChange(e.target.value as PdfImageFormat)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase"
        >
          <option value="png">{t('tools.pdfToImages.formatPng')}</option>
          <option value="jpg">{t('tools.pdfToImages.formatJpg')}</option>
          <option value="webp">{t('tools.pdfToImages.formatWebp')}</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-500 mb-1">
          {t('tools.pdfToImages.qualityRes')}
        </label>
        <select
          value={scale}
          onChange={(e) => onScaleChange(parseFloat(e.target.value))}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
        >
          <option value={1.5}>{t('tools.pdfToImages.resNormal')}</option>
          <option value={2.0}>{t('tools.pdfToImages.resHd')}</option>
          <option value={3.0}>{t('tools.pdfToImages.resUltra')}</option>
        </select>
      </div>
    </div>
  );
};
