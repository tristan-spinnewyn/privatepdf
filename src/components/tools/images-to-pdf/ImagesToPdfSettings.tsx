import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ImagesToPdfOptions } from '../../../services/pdf';

interface ImagesToPdfSettingsProps {
  options: ImagesToPdfOptions;
  onOptionsChange: (options: ImagesToPdfOptions) => void;
  outputFileName: string;
  onOutputFileNameChange: (name: string) => void;
}

const FIELD_CLASS =
  'w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20';

export const ImagesToPdfSettings: React.FC<ImagesToPdfSettingsProps> = ({
  options,
  onOptionsChange,
  outputFileName,
  onOutputFileNameChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {t('tools.imagesToPdf.orientation')}
        </label>
        <select
          value={options.orientation}
          onChange={(e) =>
            onOptionsChange({ ...options, orientation: e.target.value as ImagesToPdfOptions['orientation'] })
          }
          className={FIELD_CLASS}
        >
          <option value="auto">{t('tools.imagesToPdf.orientationAuto')}</option>
          <option value="portrait">{t('tools.imagesToPdf.orientationPortrait')}</option>
          <option value="landscape">{t('tools.imagesToPdf.orientationLandscape')}</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {t('tools.imagesToPdf.margins')}
        </label>
        <select
          value={options.margin}
          onChange={(e) => onOptionsChange({ ...options, margin: e.target.value as ImagesToPdfOptions['margin'] })}
          className={FIELD_CLASS}
        >
          <option value="normal">{t('tools.imagesToPdf.marginNormal')}</option>
          <option value="small">{t('tools.imagesToPdf.marginSmall')}</option>
          <option value="none">{t('tools.imagesToPdf.marginNone')}</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {t('tools.imagesToPdf.pdfName')}
        </label>
        <input
          type="text"
          value={outputFileName}
          onChange={(e) => onOutputFileNameChange(e.target.value)}
          placeholder="mes_images.pdf"
          className={FIELD_CLASS}
        />
      </div>
    </div>
  );
};
