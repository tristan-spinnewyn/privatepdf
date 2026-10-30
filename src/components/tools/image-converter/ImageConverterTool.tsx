import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Sparkles } from 'lucide-react';
import type { ImageFormat, ImageConversionItem } from '../../../types';
import { downloadBlob, downloadZip } from '../../../utils/download';
import { fireSuccessConfetti } from '../../../utils/confetti';
import { useToolFeedback } from '../../../hooks/useToolFeedback';
import { useImageConversionQueue } from '../../../hooks/useImageConversionQueue';
import { Dropzone } from '../../ui/Dropzone';
import { ToolHeader, HeaderActionButton } from '../../ui/ToolHeader';
import { FeedbackAlerts } from '../../ui/FeedbackAlerts';
import { ProcessingButton } from '../../ui/ProcessingButton';
import { AddFilesButton } from '../../ui/AddFilesButton';
import { ConversionOptionsBar } from './ConversionOptionsBar';
import { ConversionItemRow } from './ConversionItemRow';

const ACCEPTED_IMAGES = 'image/*,.heic,.heif,.svg,.bmp,.ico';

export const ImageConverterTool: React.FC = () => {
  const { t } = useTranslation();
  const [globalTargetFormat, setGlobalTargetFormat] = useState<ImageFormat>('jpg');
  const [quality, setQuality] = useState(0.9);
  const [scale, setScale] = useState(1.0);
  const [icoSize, setIcoSize] = useState(64);
  const [isProcessing, setIsProcessing] = useState(false);
  const { successMessage, errorMessage, showSuccess, resetFeedback } = useToolFeedback();
  const queue = useImageConversionQueue();
  const { items, doneItems } = queue;

  const handleFilesSelected = (files: File[]) => {
    queue.addFiles(files, globalTargetFormat);
    resetFeedback();
  };

  const applyGlobalFormat = (format: ImageFormat) => {
    setGlobalTargetFormat(format);
    queue.setAllFormats(format);
  };

  const clearAll = () => {
    queue.clearAll();
    resetFeedback();
  };

  const handleConvertAll = async () => {
    setIsProcessing(true);
    resetFeedback();

    await queue.convertAll({ quality, scale, icoSize });

    setIsProcessing(false);
    fireSuccessConfetti();
    showSuccess(t('tools.imageConverter.success'));
  };

  const handleDownloadSingle = (item: ImageConversionItem) => {
    if (item.convertedBlob) downloadBlob(item.convertedBlob, item.name);
  };

  const handleDownloadAllZip = () =>
    downloadZip(
      doneItems.map((it) => ({ name: it.name, blob: it.convertedBlob! })),
      'images_converties.zip'
    );

  const doneCount = items.filter((it) => it.status === 'done').length;

  return (
    <div className="space-y-6">
      <ToolHeader
        title={t('tools.imageConverter.headerTitle')}
        description={t('tools.imageConverter.headerDesc')}
        badge={t('tools.imageConverter.iosBadge')}
      >
        {items.length > 0 && <HeaderActionButton label={t('tools.merge.clearAll')} onClick={clearAll} variant="danger" />}
      </ToolHeader>

      <FeedbackAlerts successMessage={successMessage} errorMessage={errorMessage} />

      {items.length === 0 ? (
        <Dropzone onFilesSelected={handleFilesSelected} accept={ACCEPTED_IMAGES} multiple={true} />
      ) : (
        <div className="space-y-5">
          <ConversionOptionsBar
            targetFormat={globalTargetFormat}
            onTargetFormatChange={applyGlobalFormat}
            quality={quality}
            onQualityChange={setQuality}
            scale={scale}
            onScaleChange={setScale}
            icoSize={icoSize}
            onIcoSizeChange={setIcoSize}
          />

          {/* List of Files to Convert */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{items.length} {t('tools.imageConverter.imagesSelected')}</span>
              <span>{doneCount} / {items.length} {t('tools.imageConverter.imagesConverted')}</span>
            </div>

            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <ConversionItemRow
                  key={item.id}
                  item={item}
                  isProcessing={isProcessing}
                  onFormatChange={queue.setItemFormat}
                  onDownload={handleDownloadSingle}
                  onRemove={queue.removeItem}
                />
              ))}
            </ul>

            {/* Add more button */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-center">
              <AddFilesButton
                label={t('tools.imagesToPdf.addMore')}
                accept={ACCEPTED_IMAGES}
                onFilesSelected={handleFilesSelected}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                iconClassName="w-4 h-4 text-indigo-600"
              />
            </div>
          </div>

          {/* Action bottom bar */}
          <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
            <div className="text-xs sm:text-sm text-slate-600 font-medium">
              {doneCount > 0 ? (
                <span className="text-emerald-700 font-bold">
                  {doneCount} / {items.length} {t('tools.imageConverter.imagesConverted')}.
                </span>
              ) : (
                <span>{t('tools.imageConverter.imagesSelected')}: {items.length}</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {doneCount > 1 && (
                <button
                  onClick={handleDownloadAllZip}
                  className="flex-1 sm:flex-initial px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Archive className="w-4 h-4" />
                  <span>{t('tools.imageConverter.btnZip')}</span>
                </button>
              )}

              <ProcessingButton
                onClick={handleConvertAll}
                disabled={isProcessing}
                isProcessing={isProcessing}
                icon={<Sparkles className="w-5 h-5" />}
                label={t('tools.imageConverter.btnConvert', { count: items.length })}
                processingLabel={t('tools.imageConverter.processing')}
                className="flex-1 sm:flex-initial px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
