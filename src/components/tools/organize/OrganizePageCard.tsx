import React from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCw, RotateCcw, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import type { OrganizePageItem } from '../../../hooks/useOrganizePages';

interface OrganizePageCardProps {
  page: OrganizePageItem;
  index: number;
  isLast: boolean;
  onRotate: (index: number, delta: number) => void;
  onMove: (index: number, direction: 'left' | 'right') => void;
  onToggleDelete: (index: number) => void;
}

export const OrganizePageCard: React.FC<OrganizePageCardProps> = ({
  page,
  index,
  isLast,
  onRotate,
  onMove,
  onToggleDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
        page.isDeleted
          ? 'border-rose-300 bg-rose-50/40 opacity-60'
          : 'border-slate-200/90 hover:border-amber-400'
      }`}
    >
      {/* Card Header with Page Index */}
      <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700">
          {t('tools.organize.page')} {index + 1}
          {page.originalIndex !== index && (
            <span className="text-[10px] text-slate-400 ml-1 font-normal">
              ({t('tools.organize.orig')} {page.originalIndex + 1})
            </span>
          )}
        </span>

        {page.rotation !== 0 && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
            {page.rotation}°
          </span>
        )}
      </div>

      {/* Thumbnail Preview Area */}
      <div className="relative aspect-3/4 p-3 flex items-center justify-center bg-slate-100/50 overflow-hidden">
        <img
          src={page.thumbnailUrl}
          alt={`${t('tools.organize.page')} ${index + 1}`}
          style={{
            transform: `rotate(${page.rotation}deg)`,
            transition: 'transform 0.25s ease-in-out',
          }}
          className="max-h-full max-w-full object-contain shadow-xs rounded-sm"
        />

        {/* Deleted Overlay */}
        {page.isDeleted && (
          <div className="absolute inset-0 bg-rose-900/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center text-white">
            <span className="text-xs font-bold bg-rose-600 px-2.5 py-1 rounded-lg shadow-sm">
              {t('tools.organize.pageDeleted')}
            </span>
            <button
              onClick={() => onToggleDelete(index)}
              className="mt-2 text-[11px] underline font-medium hover:text-rose-100 cursor-pointer"
            >
              {t('tools.organize.restore')}
            </button>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onRotate(index, -90)}
            title={t('tools.organize.rotateLeft')}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRotate(index, 90)}
            title={t('tools.organize.rotateRight')}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-0.5">
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
          onClick={() => onToggleDelete(index)}
          title={page.isDeleted ? t('tools.organize.restore') : t('tools.organize.remove')}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            page.isDeleted
              ? 'text-emerald-600 hover:bg-emerald-50'
              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
