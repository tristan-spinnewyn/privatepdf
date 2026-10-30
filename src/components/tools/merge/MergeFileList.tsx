import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Trash2, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import type { PdfFileItem } from '../../../types';
import { formatBytes } from '../../../utils/format-bytes';
import { AddFilesButton } from '../../ui/AddFilesButton';

interface MergeFileListProps {
  items: PdfFileItem[];
  onMove: (index: number, direction: 'up' | 'down') => void;
  onRemove: (id: string) => void;
  onAddFiles: (files: File[]) => void;
}

export const MergeFileList: React.FC<MergeFileListProps> = ({ items, onMove, onRemove, onAddFiles }) => {
  const { t } = useTranslation();
  const totalPages = items.reduce((sum, item) => sum + (item.pageCount || 0), 0);
  const totalSize = items.reduce((sum, item) => sum + item.size, 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>{items.length} {items.length > 1 ? t('tools.merge.docsSelected') : t('tools.merge.docSelected')}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">{formatBytes(totalSize)}</span>
          {totalPages > 0 && (
            <>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{totalPages} {t('tools.merge.pages')} {t('tools.merge.total')}</span>
            </>
          )}
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate" title={item.name}>
                  {item.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatBytes(item.size)}
                  {item.pageCount !== undefined && ` • ${item.pageCount} ${item.pageCount > 1 ? t('tools.merge.pages') : t('tools.merge.page')}`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onMove(index, 'up')}
                disabled={index === 0}
                title={t('tools.merge.moveUp')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => onMove(index, 'down')}
                disabled={index === items.length - 1}
                title={t('tools.merge.moveDown')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRemove(item.id)}
                title={t('tools.merge.delete')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Add more button */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-center">
        <AddFilesButton
          label={t('tools.merge.addMore')}
          accept=".pdf"
          onFilesSelected={onAddFiles}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
          iconClassName="w-4 h-4 text-indigo-600"
        />
      </div>
    </div>
  );
};
