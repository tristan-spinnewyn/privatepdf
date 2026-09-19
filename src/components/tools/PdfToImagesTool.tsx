import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropzone } from '../ui/Dropzone';
import { convertPdfToImages, downloadPdfImagesAsZip, downloadFile } from '../../lib/pdf-to-images';
import type { PdfPageImage } from '../../lib/pdf-to-images';
import { formatBytes } from '../../lib/pdf-service';
import { fireSuccessConfetti } from '../../lib/confetti';
import {
  FileImage,
  Download,
  Archive,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export const PdfToImagesTool: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [scale, setScale] = useState<number>(2.0); // 2x default for crisp quality
  const [images, setImages] = useState<PdfPageImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (!files || files.length === 0) return;
    setFile(files[0]);
    setImages([]);
    setProgress(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgress({ current: 0, total: 1 });

    try {
      const extractedImages = await convertPdfToImages(file, {
        format,
        scale,
        onProgress: (current, total) => {
          setProgress({ current, total });
        },
      });

      setImages(extractedImages);
      fireSuccessConfetti();
      setSuccessMessage(t('tools.pdfToImages.success', { count: extractedImages.length }));
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(t('tools.pdfToImages.error'));
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleDownloadZip = async () => {
    if (!file || images.length === 0) return;
    await downloadPdfImagesAsZip(images, file.name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('tools.pdfToImages.headerTitle')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('tools.pdfToImages.headerDesc')}
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setImages([]);
            }}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            {t('tools.pdfToImages.changeFile')}
          </button>
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
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 truncate max-w-xs sm:max-w-md" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                </div>
              </div>

              {/* Conversion settings */}
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {t('tools.pdfToImages.imageFormat')}
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase"
                  >
                    <option value="png">{t('tools.pdfToImages.formatPng')}</option>
                    <option value="jpg">{t('tools.pdfToImages.formatJpg')}</option>
                    <option value="webp">{t('tools.pdfToImages.formatWebp')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {t('tools.pdfToImages.qualityRes')}
                  </label>
                  <select
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value={1.5}>{t('tools.pdfToImages.resNormal')}</option>
                    <option value={2.0}>{t('tools.pdfToImages.resHd')}</option>
                    <option value={3.0}>{t('tools.pdfToImages.resUltra')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Launch button if not yet converted */}
            {images.length === 0 && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {progress
                          ? t('tools.pdfToImages.processingProgress', { current: progress.current, total: progress.total })
                          : t('tools.pdfToImages.processing')}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileImage className="w-4 h-4" />
                      <span>{t('tools.pdfToImages.btnExtract')}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Grid of Extracted Images */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img) => (
                  <div
                    key={img.pageNumber}
                    className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400 transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md"
                  >
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Page {img.pageNumber}</span>
                      <span className="text-[10px] text-slate-400">{img.width}×{img.height}</span>
                    </div>

                    <div className="aspect-3/4 p-2 bg-slate-100/40 flex items-center justify-center overflow-hidden">
                      <img
                        src={img.dataUrl}
                        alt={`Page ${img.pageNumber}`}
                        className="max-h-full max-w-full object-contain rounded shadow-xs"
                      />
                    </div>

                    <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">{formatBytes(img.blob.size)}</span>
                      <button
                        onClick={() => downloadFile(img.blob, img.filename)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        title={t('tools.pdfToImages.downloadPage')}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('tools.pdfToImages.downloadPage')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Action Bar */}
              <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl flex items-center justify-between gap-4 z-20">
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                  {t('tools.pdfToImages.summary', { count: images.length })}
                </div>

                <button
                  onClick={handleDownloadZip}
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
