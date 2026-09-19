import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropzone } from '../ui/Dropzone';
import type { PdfFileItem } from '../../types';
import { mergePdfs, downloadPdf, formatBytes } from '../../lib/pdf-service';
import { getPdfPageCount } from '../../lib/pdf-renderer';
import { fireSuccessConfetti } from '../../lib/confetti';
import { 
  FileText, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Download, 
  Loader2, 
  CheckCircle2, 
  Layers, 
  AlertCircle 
} from 'lucide-react';

export const MergeTool: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFileName, setOutputFileName] = useState('documents_fusionnes.pdf');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesAdded = async (newFiles: File[]) => {
    const newItems: PdfFileItem[] = newFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setSuccessMessage(null);
    setErrorMessage(null);

    // Asynchronously calculate page count for each added file
    for (const item of newItems) {
      try {
        const count = await getPdfPageCount(item.file);
        setItems((current) =>
          current.map((it) => (it.id === item.id ? { ...it, pageCount: count } : it))
        );
      } catch (err) {
        console.warn('Could not read page count for', item.name, err);
      }
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setItems(newItems);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    setItems([]);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setErrorMessage(t('tools.merge.errorMin'));
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const files = items.map((it) => it.file);
      const mergedBytes = await mergePdfs(files);
      const fileNameToDownload = outputFileName.trim().length > 0 
        ? outputFileName.trim() 
        : 'documents_fusionnes.pdf';

      downloadPdf(mergedBytes, fileNameToDownload);
      fireSuccessConfetti();
      setSuccessMessage(t('tools.merge.success', { count: items.length }));
    } catch (err) {
      console.error(err);
      setErrorMessage("Error merging documents / Erreur lors de la fusion.");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = items.reduce((sum, item) => sum + (item.pageCount || 0), 0);
  const totalSize = items.reduce((sum, item) => sum + item.size, 0);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('tools.merge.headerTitle')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('tools.merge.headerDesc')}
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              {t('tools.merge.clearAll')}
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Main Area */}
      {items.length === 0 ? (
        <Dropzone
          onFilesSelected={handleFilesAdded}
          multiple={true}
        />
      ) : (
        <div className="space-y-4">
          {/* File list */}
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
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      title={t('tools.merge.moveUp')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === items.length - 1}
                      title={t('tools.merge.moveDown')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
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
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>{t('tools.merge.addMore')}</span>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) handleFilesAdded(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action bottom bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex-1 max-w-sm">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t('tools.merge.outputName')}
              </label>
              <input
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
                placeholder={t('tools.merge.outputPlaceholder')}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              onClick={handleMerge}
              disabled={isProcessing || items.length < 2}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('tools.merge.processing')}</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>{t('tools.merge.btnMerge', { count: items.length })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
