import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCw, RotateCcw, Download, Undo2 } from 'lucide-react';
import { organizePdf, renderAllPageThumbnails } from '../../../services/pdf';
import { downloadPdf } from '../../../utils/download';
import { fireSuccessConfetti } from '../../../utils/confetti';
import { formatBytes } from '../../../utils/format-bytes';
import { stripExtension } from '../../../utils/file-name';
import { useToolFeedback } from '../../../hooks/useToolFeedback';
import { buildOrganizePlan, useOrganizePages } from '../../../hooks/useOrganizePages';
import { useReleasePdfDocument } from '../../../hooks/useReleasePdfDocument';
import { Dropzone } from '../../ui/Dropzone';
import { ToolHeader, HeaderActionButton } from '../../ui/ToolHeader';
import { FeedbackAlerts } from '../../ui/FeedbackAlerts';
import { ProcessingButton } from '../../ui/ProcessingButton';
import { FileInfo } from '../../ui/FileInfo';
import { LoadingPanel } from '../../ui/LoadingPanel';
import { OrganizePageCard } from './OrganizePageCard';

const THUMBNAIL_WIDTH = 280;

export const OrganizeTool: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { successMessage, errorMessage, showSuccess, showError, resetFeedback } = useToolFeedback();
  const { pages, remainingCount, loadPages, clearPages, rotatePage, rotateAll, toggleDeletePage, movePage } =
    useOrganizePages();
  useReleasePdfDocument(file);

  const loadFile = async (selectedFile: File) => {
    setFile(selectedFile);
    clearPages();
    resetFeedback();
    setIsLoadingThumbnails(true);

    try {
      loadPages(await renderAllPageThumbnails(selectedFile, THUMBNAIL_WIDTH));
    } catch (err) {
      console.error(err);
      showError(t('common.errorReadPages'));
    } finally {
      setIsLoadingThumbnails(false);
    }
  };

  const handleExport = async () => {
    if (!file) return;

    setIsProcessing(true);
    resetFeedback();

    try {
      const plan = buildOrganizePlan(pages);
      const organizedBytes = await organizePdf(file, plan.pageOrder, plan.rotations, plan.deletedPages);
      downloadPdf(organizedBytes, `${stripExtension(file.name)}_organise.pdf`);

      fireSuccessConfetti();
      showSuccess(t('tools.organize.success'));
    } catch (err) {
      console.error(err);
      showError(t('tools.organize.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToolHeader title={t('tools.organize.headerTitle')} description={t('tools.organize.headerDesc')}>
        {file && (
          <div className="flex items-center gap-2">
            <HeaderActionButton
              label={t('tools.organize.changeFile')}
              onClick={() => {
                setFile(null);
                clearPages();
              }}
            />
            <button
              onClick={() => loadFile(file)}
              title={t('tools.organize.reset')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>{t('tools.organize.reset')}</span>
            </button>
          </div>
        )}
      </ToolHeader>

      <FeedbackAlerts successMessage={successMessage} errorMessage={errorMessage} />

      {!file ? (
        <Dropzone onFilesSelected={(files) => loadFile(files[0])} multiple={false} />
      ) : (
        <div className="space-y-5">
          {/* File details banner & global controls */}
          <div className="bg-white p-4 sm:px-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <FileInfo
              fileName={file.name}
              details={`${formatBytes(file.size)} • ${t('tools.organize.pagesKept', { remaining: remainingCount, total: pages.length })}`}
              iconClassName="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100"
            />

            {/* Global Rotations */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => rotateAll(-90)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('tools.organize.rotateAllLeft')}</span>
              </button>
              <button
                onClick={() => rotateAll(90)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('tools.organize.rotateAllRight')}</span>
              </button>
            </div>
          </div>

          {isLoadingThumbnails ? (
            <LoadingPanel
              title={t('tools.organize.rendering')}
              hint={t('tools.organize.renderingHint')}
              spinnerClassName="text-amber-500"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {pages.map((page, index) => (
                  <OrganizePageCard
                    key={`${page.originalIndex}-${index}`}
                    page={page}
                    index={index}
                    isLast={index === pages.length - 1}
                    onRotate={rotatePage}
                    onMove={movePage}
                    onToggleDelete={toggleDeletePage}
                  />
                ))}
              </div>

              {/* Download Bar */}
              <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl flex items-center justify-between gap-4 z-20">
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                  {t('tools.organize.summary', { count: remainingCount })}
                </div>

                <ProcessingButton
                  onClick={handleExport}
                  disabled={isProcessing || remainingCount === 0}
                  isProcessing={isProcessing}
                  icon={<Download className="w-5 h-5" />}
                  label={t('tools.organize.btnExport')}
                  processingLabel={t('tools.organize.processing')}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
