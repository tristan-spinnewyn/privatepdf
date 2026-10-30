import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import type { PdfFileItem } from '../../../types';
import { mergePdfs, getPdfPageCount } from '../../../services/pdf';
import { downloadPdf } from '../../../utils/download';
import { fireSuccessConfetti } from '../../../utils/confetti';
import { moveItem } from '../../../utils/array';
import { createItemId } from '../../../utils/item-id';
import { useToolFeedback } from '../../../hooks/useToolFeedback';
import { Dropzone } from '../../ui/Dropzone';
import { ToolHeader, HeaderActionButton } from '../../ui/ToolHeader';
import { FeedbackAlerts } from '../../ui/FeedbackAlerts';
import { ProcessingButton } from '../../ui/ProcessingButton';
import { MergeFileList } from './MergeFileList';

const DEFAULT_OUTPUT_NAME = 'documents_fusionnes.pdf';

export const MergeTool: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFileName, setOutputFileName] = useState(DEFAULT_OUTPUT_NAME);
  const { successMessage, errorMessage, showSuccess, showError, resetFeedback } = useToolFeedback();

  const handleFilesAdded = async (newFiles: File[]) => {
    const newItems: PdfFileItem[] = newFiles.map((file) => ({
      id: createItemId(file),
      file,
      name: file.name,
      size: file.size,
    }));

    setItems((prev) => [...prev, ...newItems]);
    resetFeedback();

    // Asynchronously calculate page count for each added file
    for (const item of newItems) {
      try {
        const count = await getPdfPageCount(item.file);
        setItems((current) => current.map((it) => (it.id === item.id ? { ...it, pageCount: count } : it)));
      } catch (err) {
        console.warn('Could not read page count for', item.name, err);
      }
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    setItems((prev) => moveItem(prev, index, direction === 'up' ? index - 1 : index + 1));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    setItems([]);
    resetFeedback();
  };

  const handleMerge = async () => {
    setIsProcessing(true);
    resetFeedback();

    try {
      const mergedBytes = await mergePdfs(items.map((it) => it.file));
      downloadPdf(mergedBytes, outputFileName.trim() || DEFAULT_OUTPUT_NAME);
      fireSuccessConfetti();
      showSuccess(t('tools.merge.success', { count: items.length }));
    } catch (err) {
      console.error(err);
      showError('Error merging documents / Erreur lors de la fusion.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToolHeader title={t('tools.merge.headerTitle')} description={t('tools.merge.headerDesc')}>
        {items.length > 0 && <HeaderActionButton label={t('tools.merge.clearAll')} onClick={clearAll} variant="danger" />}
      </ToolHeader>

      <FeedbackAlerts successMessage={successMessage} errorMessage={errorMessage} />

      {items.length === 0 ? (
        <Dropzone onFilesSelected={handleFilesAdded} multiple={true} />
      ) : (
        <div className="space-y-4">
          <MergeFileList items={items} onMove={handleMove} onRemove={removeItem} onAddFiles={handleFilesAdded} />

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

            <ProcessingButton
              onClick={handleMerge}
              disabled={isProcessing || items.length < 2}
              isProcessing={isProcessing}
              icon={<Download className="w-5 h-5" />}
              label={t('tools.merge.btnMerge', { count: items.length })}
              processingLabel={t('tools.merge.processing')}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            />
          </div>
        </div>
      )}
    </div>
  );
};
