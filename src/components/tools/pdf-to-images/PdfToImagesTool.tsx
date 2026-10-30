import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileImage, Archive } from 'lucide-react';
import {
  convertPdfToImages,
  downloadPdfImagesAsZip,
  type PdfImageFormat,
  type PdfPageImage,
} from '../../../services/pdf';
import { downloadBlob } from '../../../utils/download';
import { fireSuccessConfetti } from '../../../utils/confetti';
import { formatBytes } from '../../../utils/format-bytes';
import { useToolFeedback } from '../../../hooks/useToolFeedback';
import { useReleasePdfDocument } from '../../../hooks/useReleasePdfDocument';
import { Dropzone } from '../../ui/Dropzone';
import { ToolHeader, HeaderActionButton } from '../../ui/ToolHeader';
import { FeedbackAlerts } from '../../ui/FeedbackAlerts';
import { ProcessingButton } from '../../ui/ProcessingButton';
import { FileInfo } from '../../ui/FileInfo';
import { PdfToImagesOptions } from './PdfToImagesOptions';
import { ExtractedImageCard } from './ExtractedImageCard';

export const PdfToImagesTool: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<PdfImageFormat>('png');
  const [scale, setScale] = useState(2.0); // 2x default for crisp quality
  const [images, setImages] = useState<PdfPageImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const { successMessage, errorMessage, showSuccess, showError, resetFeedback } = useToolFeedback();
  useReleasePdfDocument(file);

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setImages([]);
    setProgress(null);
    resetFeedback();
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    resetFeedback();
    setProgress({ current: 0, total: 1 });

    try {
      const extractedImages = await convertPdfToImages(file, {
        format,
        scale,
        onProgress: (current, total) => setProgress({ current, total }),
      });

      setImages(extractedImages);
      fireSuccessConfetti();
      showSuccess(t('tools.pdfToImages.success', { count: extractedImages.length }));
    } catch (err: unknown) {
      console.error(err);
      showError(t('tools.pdfToImages.error'));
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <ToolHeader title={t('tools.pdfToImages.headerTitle')} description={t('tools.pdfToImages.headerDesc')}>
        {file && (
          <HeaderActionButton
            label={t('tools.pdfToImages.changeFile')}
            onClick={() => {
              setFile(null);
              setImages([]);
            }}
          />
        )}
      </ToolHeader>

      <FeedbackAlerts successMessage={successMessage} errorMessage={errorMessage} />

      {!file ? (
        <Dropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title={t('tools.pdfToImages.dropzoneTitle')}
          description={t('tools.pdfToImages.dropzoneDesc')}
        />
      ) : (
        <div className="space-y-5">
          {/* File details & options */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <FileInfo
                fileName={file.name}
                details={formatBytes(file.size)}
                iconClassName="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100"
              />
              <PdfToImagesOptions format={format} onFormatChange={setFormat} scale={scale} onScaleChange={setScale} />
            </div>

            {/* Launch button if not yet converted */}
            {images.length === 0 && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <ProcessingButton
                  onClick={handleConvert}
                  disabled={isProcessing}
                  isProcessing={isProcessing}
                  icon={<FileImage className="w-4 h-4" />}
                  label={t('tools.pdfToImages.btnExtract')}
                  processingLabel={
                    progress
                      ? t('tools.pdfToImages.processingProgress', { current: progress.current, total: progress.total })
                      : t('tools.pdfToImages.processing')
                  }
                  spinnerClassName="w-4 h-4"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                />
              </div>
            )}
          </div>

          {/* Grid of Extracted Images */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img) => (
                  <ExtractedImageCard
                    key={img.pageNumber}
                    image={img}
                    onDownload={(image) => downloadBlob(image.blob, image.filename)}
                  />
                ))}
              </div>

              {/* Bottom Action Bar */}
              <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl flex items-center justify-between gap-4 z-20">
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                  {t('tools.pdfToImages.summary', { count: images.length })}
                </div>

                <button
                  onClick={() => downloadPdfImagesAsZip(images, file.name)}
                  className="px-6 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Archive className="w-4 h-4" />
                  <span>{t('tools.pdfToImages.btnZip')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
