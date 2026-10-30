import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import type { ImageFormat } from '../../../types';
import { FORMAT_OPTIONS, ICO_SIZE_OPTIONS, LOSSY_FORMATS } from './format-options';

interface ConversionOptionsBarProps {
  targetFormat: ImageFormat;
  onTargetFormatChange: (format: ImageFormat) => void;
  quality: number;
  onQualityChange: (quality: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  icoSize: number;
  onIcoSizeChange: (size: number) => void;
}

export const ConversionOptionsBar: React.FC<ConversionOptionsBarProps> = ({
  targetFormat,
  onTargetFormatChange,
  quality,
  onQualityChange,
  scale,
  onScaleChange,
  icoSize,
  onIcoSizeChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t('tools.imageConverter.convertAllTo')}</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FORMAT_OPTIONS.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => onTargetFormatChange(fmt.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  targetFormat === fmt.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 ring-2 ring-indigo-500/20'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quality slider */}
        {LOSSY_FORMATS.includes(targetFormat) && (
          <div className="w-full md:w-56">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>{t('tools.imageConverter.quality')}</span>
              <span className="font-mono text-indigo-600">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={Math.round(quality * 100)}
              onChange={(e) => onQualityChange(parseInt(e.target.value, 10) / 100)}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        )}

        {/* ICO Size options */}
        {targetFormat === 'ico' ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('tools.imageConverter.icoSize')}
            </label>
            <select
              value={icoSize}
              onChange={(e) => onIcoSizeChange(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              {ICO_SIZE_OPTIONS.map((option) => (
                <option key={option.size} value={option.size}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          /* Scale / Resize */
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('tools.imageConverter.dimensions')}
            </label>
            <select
              value={scale}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value={1.0}>{t('tools.imageConverter.scaleOriginal')}</option>
              <option value={0.75}>{t('tools.imageConverter.scale75')}</option>
              <option value={0.5}>{t('tools.imageConverter.scale50')}</option>
              <option value={0.25}>{t('tools.imageConverter.scale25')}</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
