import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { renderAllPageThumbnails, splitPdf, type PageThumbnailImage } from '../../../services/pdf';
import { downloadPdf } from '../../../utils/download';
import { fireSuccessConfetti } from '../../../utils/confetti';
import { formatBytes } from '../../../utils/format-bytes';
import { stripExtension } from '../../../utils/file-name';
import { useToolFeedback } from '../../../hooks/useToolFeedback';
import { usePageSelection } from '../../../hooks/usePageSelection';
import { Dropzone } from '../../ui/Dropzone';
import { ToolHeader, HeaderActionButton } from '../../ui/ToolHeader';
import { FeedbackAlerts } from '../../ui/FeedbackAlerts';
import { ProcessingButton } from '../../ui/ProcessingButton';
import { FileInfo } from '../../ui/FileInfo';
import { LoadingPanel } from '../../ui/LoadingPanel';
import { SplitPageCard } from './SplitPageCard';
import { SplitQuickFilters, SplitRangeInput } from './SplitSelectionControls';

const THUMBNAIL_WIDTH = 260;

export const SplitTool: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnailImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { successMessage, errorMessage, showSuccess, showError, resetFeedback } = useToolFeedback();
  const selection = usePageSelection(pages.length);
  const { selectedPages } = selection;

  const handleFileSelected = async (files: File[]) => {
    const selectedFile = files[0];
    setFile(selectedFile);
    setPages([]);
    selection.selectNone();
    resetFeedback();
    setIsLoading(true);

    try {
      const thumbnails = await renderAllPageThumbnails(selectedFile, THUMBNAIL_WIDTH);
      setPages(thumbnails);
      if (thumbnails.length > 0) {
        selection.selectPages(new Set([1]));
      }
    } catch (err) {
      console.error(err);
      showError(t('common.errorReadPages'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    resetFeedback();

    try {
      const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
      const splitBytes = await splitPdf(file, sortedPages);
      downloadPdf(splitBytes, `${stripExtension(file.name)}_extrait_${sortedPages.length}pages.pdf`);

      fireSuccessConfetti();
      showSuccess(t('tools.split.success', { count: sortedPages.length }));
    } catch (err) {
      console.error(err);
      showError(t('tools.split.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToolHeader title={t('tools.split.headerTitle')} description={t('tools.split.headerDesc')}>
        {file && (
          <HeaderActionButton
            label={t('tools.organize.changeFile')}
            onClick={() => {
              setFile(null);
              setPages([]);
            }}
          />
        )}
      </ToolHeader>

      <FeedbackAlerts successMessage={successMessage} errorMessage={errorMessage} />

      {!file ? (
        <Dropzone onFilesSelected={handleFileSelected} multiple={false} />
      ) : (
        <div className="space-y-5">
          {/* File details and selection controls bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <FileInfo
                fileName={file.name}
                details={`${formatBytes(file.size)} • ${t('tools.split.pagesSelected', { count: selectedPages.size, total: pages.length })}`}
                iconClassName="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100"
              />
              <SplitQuickFilters
                onSelectAll={selection.selectAll}
                onSelectNone={selection.selectNone}
                onSelectOdd={selection.selectOdd}
                onSelectEven={selection.selectEven}
              />
            </div>

            <SplitRangeInput rangeInput={selection.rangeInput} onRangeInputChange={selection.changeRangeInput} />
          </div>

          {isLoading ? (
            <LoadingPanel title={t('tools.split.loading')} spinnerClassName="text-purple-600" />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {pages.map((page) => (
                  <SplitPageCard
                    key={page.pageNumber}
                    pageNumber={page.pageNumber}
                    thumbnailUrl={page.dataUrl}
                    isSelected={selectedPages.has(page.pageNumber)}
                    onToggle={selection.togglePage}
                  />
                ))}
              </div>

              {/* Download Bar */}
              <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl flex items-center justify-between gap-4 z-20">
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                  {t('tools.split.summary', { count: selectedPages.size, total: pages.length })}
                </div>

                <ProcessingButton
                  onClick={handleExtract}
                  disabled={isProcessing || selectedPages.size === 0}
                  isProcessing={isProcessing}
                  icon={<Download className="w-5 h-5" />}
                  label={t('tools.split.btnExtract', { count: selectedPages.size })}
                  processingLabel={t('tools.split.processing')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
