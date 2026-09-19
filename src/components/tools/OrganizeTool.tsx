import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropzone } from '../ui/Dropzone';
import { renderPageThumbnail, getPdfPageCount } from '../../lib/pdf-renderer';
import { organizePdf, downloadPdf, formatBytes } from '../../lib/pdf-service';
import { fireSuccessConfetti } from '../../lib/confetti';
import {
  RotateCw,
  RotateCcw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Undo2
} from 'lucide-react';

interface PageItem {
  originalIndex: number; // 0-indexed
  pageNumber: number; // 1-indexed display
  thumbnailUrl: string;
  rotation: number; // 0, 90, 180, 270
  isDeleted: boolean;
  width: number;
  height: number;
}

export const OrganizeTool: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setPages([]);
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsLoadingThumbnails(true);

    try {
      const pageCount = await getPdfPageCount(selectedFile);
      const items: PageItem[] = [];

      for (let i = 1; i <= pageCount; i++) {
        const thumb = await renderPageThumbnail(selectedFile, i, 280);
        items.push({
          originalIndex: i - 1,
          pageNumber: i,
          thumbnailUrl: thumb.dataUrl,
          rotation: 0,
          isDeleted: false,
          width: thumb.width,
          height: thumb.height,
        });
      }

      setPages(items);
    } catch (err) {
      console.error(err);
      setErrorMessage("Error reading PDF pages / Erreur de lecture.");
    } finally {
      setIsLoadingThumbnails(false);
    }
  };

  const rotatePage = (index: number, delta: number) => {
    setPages((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const newRotation = (p.rotation + delta + 360) % 360;
        return { ...p, rotation: newRotation };
      })
    );
  };

  const rotateAll = (delta: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + delta + 360) % 360,
      }))
    );
  };

  const toggleDeletePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, isDeleted: !p.isDeleted } : p))
    );
  };

  const movePage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= pages.length) return;

    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    setPages(newPages);
  };

  const resetAll = () => {
    if (!file) return;
    handleFileSelected([file]);
  };

  const handleExport = async () => {
    if (!file) return;

    const remainingPages = pages.filter((p) => !p.isDeleted);
    if (remainingPages.length === 0) {
      setErrorMessage(t('tools.organize.emptyError', 'Toutes les pages ont été supprimées / All pages deleted.'));
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const pageOrder = pages.map((p) => p.originalIndex);
      const rotationsMap = new Map<number, number>();
      const deletedSet = new Set<number>();

      pages.forEach((p) => {
        if (p.rotation !== 0) {
          rotationsMap.set(p.originalIndex, p.rotation);
        }
        if (p.isDeleted) {
          deletedSet.add(p.originalIndex);
        }
      });

      const organizedBytes = await organizePdf(file, pageOrder, rotationsMap, deletedSet);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadPdf(organizedBytes, `${baseName}_organise.pdf`);

      fireSuccessConfetti();
      setSuccessMessage(t('tools.organize.success'));
    } catch (err) {
      console.error(err);
      setErrorMessage("Error organizing PDF / Erreur d'organisation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const remainingCount = pages.filter((p) => !p.isDeleted).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('tools.organize.headerTitle')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('tools.organize.headerDesc')}
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFile(null);
                setPages([]);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              {t('tools.organize.changeFile')}
            </button>
            <button
              onClick={resetAll}
              title={t('tools.organize.reset')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>{t('tools.organize.reset')}</span>
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
      {!file ? (
        <Dropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
        />
      ) : (
        <div className="space-y-5">
          {/* File details banner & global controls */}
          <div className="bg-white p-4 sm:px-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 truncate max-w-xs sm:max-w-md" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatBytes(file.size)} • {t('tools.organize.pagesKept', { remaining: remainingCount, total: pages.length })}
                </p>
              </div>
            </div>

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

          {/* Thumbnails Grid */}
          {isLoadingThumbnails ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
              <p className="text-base font-bold text-slate-800">{t('tools.organize.rendering')}</p>
              <p className="text-xs text-slate-400 mt-1">
                {t('tools.organize.renderingHint')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {pages.map((page, index) => (
                <div
                  key={`${page.originalIndex}-${index}`}
                  className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
                    page.isDeleted
                      ? 'border-rose-300 bg-rose-50/40 opacity-60'
                      : 'border-slate-200/90 hover:border-amber-400'
                  }`}
                >
                  {/* Card Header with Page Index */}
                  <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      {t('tools.organize.page')} {index + 1}
                      {page.originalIndex + 1 !== index + 1 && (
                        <span className="text-[10px] text-slate-400 ml-1 font-normal">
                          ({t('tools.organize.orig')} {page.originalIndex + 1})
                        </span>
                      )}
                    </span>

                    {page.rotation !== 0 && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                        {page.rotation}°
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Preview Area */}
                  <div className="relative aspect-3/4 p-3 flex items-center justify-center bg-slate-100/50 overflow-hidden">
                    <img
                      src={page.thumbnailUrl}
                      alt={`${t('tools.organize.page')} ${index + 1}`}
                      style={{
                        transform: `rotate(${page.rotation}deg)`,
                        transition: 'transform 0.25s ease-in-out',
                      }}
                      className="max-h-full max-w-full object-contain shadow-xs rounded-sm"
                    />

                    {/* Deleted Overlay */}
                    {page.isDeleted && (
                      <div className="absolute inset-0 bg-rose-900/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center text-white">
                        <span className="text-xs font-bold bg-rose-600 px-2.5 py-1 rounded-lg shadow-sm">
                          {t('tools.organize.pageDeleted')}
                        </span>
                        <button
                          onClick={() => toggleDeletePage(index)}
                          className="mt-2 text-[11px] underline font-medium hover:text-rose-100 cursor-pointer"
                        >
                          {t('tools.organize.restore')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Toolbar */}
                  <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => rotatePage(index, -90)}
                        title={t('tools.organize.rotateLeft')}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => rotatePage(index, 90)}
                        title={t('tools.organize.rotateRight')}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => movePage(index, 'left')}
                        disabled={index === 0}
                        title={t('tools.organize.moveLeft')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer rounded-lg"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => movePage(index, 'right')}
                        disabled={index === pages.length - 1}
                        title={t('tools.organize.moveRight')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer rounded-lg"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => toggleDeletePage(index)}
                      title={page.isDeleted ? t('tools.organize.restore') : t('tools.organize.remove')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        page.isDeleted
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Download Bar */}
          {!isLoadingThumbnails && (
            <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl flex items-center justify-between gap-4 z-20">
              <div className="text-xs sm:text-sm text-slate-600 font-medium">
                {t('tools.organize.summary', { count: remainingCount })}
              </div>

              <button
                onClick={handleExport}
                disabled={isProcessing || remainingCount === 0}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('tools.organize.processing')}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>{t('tools.organize.btnExport')}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
