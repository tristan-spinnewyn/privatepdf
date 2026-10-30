import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, ArrowRight } from 'lucide-react';
import type { ImageConversionItem, ImageFormat } from '../../../types';
import { formatBytes } from '../../../utils/format-bytes';
import { FORMAT_OPTIONS } from './format-options';

interface ConversionItemRowProps {
  item: ImageConversionItem;
  isProcessing: boolean;
  onFormatChange: (id: string, format: ImageFormat) => void;
  onDownload: (item: ImageConversionItem) => void;
  onRemove: (id: string) => void;
}

export const ConversionItemRow: React.FC<ConversionItemRowProps> = ({
  item,
  isProcessing,
  onFormatChange,
  onDownload,
  onRemove,
}) => {
  const { t } = useTranslation();

  return (
    <li className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
      {/* File information */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {item.previewUrl ? (
            <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase">HEIC</span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate max-w-xs sm:max-w-md" title={item.name}>
            {item.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
              {item.originalFormat}
            </span>
            <span>{formatBytes(item.size)}</span>

            {item.convertedSize !== undefined && (
              <>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                  {formatBytes(item.convertedSize)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions & Format switch */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <select
          value={item.targetFormat}
          onChange={(e) => onFormatChange(item.id, e.target.value as ImageFormat)}
          disabled={isProcessing}
          className="px-2.5 py-1.5 text-xs font-bold uppercase bg-slate-100 border border-slate-200 rounded-xl"
        >
          {FORMAT_OPTIONS.map((f) => (
            <option key={f.id} value={f.id}>
              → {f.label}
            </option>
          ))}
        </select>

        {item.status === 'done' && (
          <button
            onClick={() => onDownload(item)}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
            title={t('tools.pdfToImages.downloadPage')}
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onRemove(item.id)}
          disabled={isProcessing}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          title={t('tools.merge.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
};
