import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-700">{t('tools.sign.pageToSign')}</span>
        <span className="px-2.5 py-1 bg-slate-100 font-extrabold text-xs text-slate-800 rounded-lg">
          {currentPage} / {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
          title={t('tools.sign.prev')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
          title={t('tools.sign.next')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
