import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import type { ImageItem } from '../../../types';
import { imagesToPdf, type ImagesToPdfOptions } from '../../../services/pdf';
import { downloadPdf } from '../../../utils/download';
import { fireSuccessConfetti } from '../../../utils/confetti';
import { moveItem } from '../../../utils/array';
import { createItemId } from '../../../utils/item-id';
import { useToolFeedback } from '../../../hooks/useToolFeedback';
import { Dropzone } from '../../ui/Dropzone';
import { ToolHeader, HeaderActionButton } from '../../ui/ToolHeader';
import { FeedbackAlerts } from '../../ui/FeedbackAlerts';
import { ProcessingButton } from '../../ui/ProcessingButton';
import { AddFilesButton } from '../../ui/AddFilesButton';
import { ImagesToPdfSettings } from './ImagesToPdfSettings';
import { ImagePageCard } from './ImagePageCard';

const ACCEPTED_IMAGES = 'image/*,.heic,.heif';
const DEFAULT_OUTPUT_NAME = 'mes_images.pdf';

export const ImagesToPdfTool: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ImageItem[]>([]);
  const [options, setOptions] = useState<ImagesToPdfOptions>({ orientation: 'auto', margin: 'normal' });
  const [outputFileName, setOutputFileName] = useState(DEFAULT_OUTPUT_NAME);
  const [isProcessing, setIsProcessing] = useState(false);
  const { successMessage, errorMessage, showSuccess, showError, resetFeedback } = useToolFeedback();

  const handleImagesSelected = (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: createItemId(file),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    setItems((prev) => [...prev, ...newItems]);
    resetFeedback();
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    setItems((prev) => moveItem(prev, index, direction === 'left' ? index - 1 : index + 1));
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    setItems([]);
    resetFeedback();
  };

  const handleConvert = async () => {
    setIsProcessing(true);
    resetFeedback();

    try {
      const pdfBytes = await imagesToPdf(items.map((it) => it.file), options);
      downloadPdf(pdfBytes, outputFileName.trim() || DEFAULT_OUTPUT_NAME);

      fireSuccessConfetti();
      showSuccess(t('tools.imagesToPdf.success', { count: items.length }));
    } catch (err) {
      console.error(err);
      showError(t('tools.imagesToPdf.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToolHeader title={t('tools.imagesToPdf.headerTitle')} description={t('tools.imagesToPdf.headerDesc')}>
        {items.length > 0 && <HeaderActionButton label={t('tools.merge.clearAll')} onClick={clearAll} variant="danger" />}
      </ToolHeader>

      <FeedbackAlerts successMessage={successMessage} errorMessage={errorMessage} />

      {items.length === 0 ? (
        <Dropzone onFilesSelected={handleImagesSelected} accept={ACCEPTED_IMAGES} multiple={true} />
      ) : (
        <div className="space-y-5">
          <ImagesToPdfSettings
            options={options}
            onOptionsChange={setOptions}
            outputFileName={outputFileName}
            onOutputFileNameChange={setOutputFileName}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item, index) => (
              <ImagePageCard
                key={item.id}
                item={item}
                index={index}
                isLast={index === items.length - 1}
                onMove={handleMove}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <AddFilesButton
              label={t('tools.imagesToPdf.addMore')}
              accept={ACCEPTED_IMAGES}
              onFilesSelected={handleImagesSelected}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-2xl transition-colors cursor-pointer shadow-xs"
              iconClassName="w-4 h-4 text-rose-600"
            />
          </div>

          {/* Download bar */}
          <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl flex items-center justify-between gap-4 z-20">
            <div className="text-xs sm:text-sm text-slate-600 font-medium">
              {t('tools.imagesToPdf.summary', { count: items.length })}
            </div>

            <ProcessingButton
              onClick={handleConvert}
              disabled={isProcessing}
              isProcessing={isProcessing}
              icon={<Download className="w-5 h-5" />}
              label={t('tools.imagesToPdf.btnGenerate')}
              processingLabel={t('tools.imagesToPdf.processing')}
              className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            />
          </div>
        </div>
      )}
    </div>
  );
};
