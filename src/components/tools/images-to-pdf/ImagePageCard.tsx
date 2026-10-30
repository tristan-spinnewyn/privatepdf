import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import type { ImageItem } from '../../../types';
import { formatBytes } from '../../../utils/format-bytes';

interface ImagePageCardProps {
  item: ImageItem;
  index: number;
  isLast: boolean;
  onMove: (index: number, direction: 'left' | 'right') => void;
  onRemove: (id: string) => void;
}

export const ImagePageCard: React.FC<ImagePageCardProps> = ({ item, index, isLast, onMove, onRemove }) => {
  const { t } = useTranslation();

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-rose-300 transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md">
      {/* Header */}
      <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700">{t('tools.organize.page')} {index + 1}</span>
        <span className="text-[10px] text-slate-400 font-mono">{formatBytes(item.size)}</span>
      </div>

      {/* Preview Image */}
      <div className="aspect-3/4 p-2 bg-slate-100/50 flex items-center justify-center overflow-hidden">
        <img
          src={item.previewUrl}
          alt={item.name}
          className="max-h-full max-w-full object-contain rounded shadow-xs"
        />
      </div>

      {/* Card footer with actions */}
      <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(index, 'left')}
            disabled={index === 0}
            title={t('tools.organize.moveLeft')}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMove(index, 'right')}
            disabled={isLast}
            title={t('tools.organize.moveRight')}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer rounded-lg"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          title={t('tools.merge.delete')}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer rounded-lg"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
