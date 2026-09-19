import React, { useState } from 'react';
import { Dropzone } from '../ui/Dropzone';
import { renderPageThumbnail, getPdfPageCount } from '../../lib/pdf-renderer';
import { splitPdf, downloadPdf, formatBytes } from '../../lib/pdf-service';
import { fireSuccessConfetti } from '../../lib/confetti';
import {
  Scissors,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Check
} from 'lucide-react';

interface PagePreview {
  pageNumber: number; // 1-indexed
  thumbnailUrl: string;
}

export const SplitTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setPages([]);
    setSelectedPages(new Set());
    setRangeInput('');
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const pageCount = await getPdfPageCount(selectedFile);
      const items: PagePreview[] = [];

      for (let i = 1; i <= pageCount; i++) {
        const thumb = await renderPageThumbnail(selectedFile, i, 260);
        items.push({
          pageNumber: i,
          thumbnailUrl: thumb.dataUrl,
        });
      }

      setPages(items);
      // Select first page by default
      if (items.length > 0) {
        setSelectedPages(new Set([1]));
        setRangeInput('1');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Impossible de lire les pages du document PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    const newSet = new Set(selectedPages);
    if (newSet.has(pageNum)) {
      newSet.delete(pageNum);
    } else {
      newSet.add(pageNum);
    }
    setSelectedPages(newSet);
    updateRangeFromSet(newSet);
  };

  const selectAll = () => {
    const all = new Set(pages.map((p) => p.pageNumber));
    setSelectedPages(all);
    updateRangeFromSet(all);
  };

  const selectNone = () => {
    const empty = new Set<number>();
    setSelectedPages(empty);
    setRangeInput('');
  };

  const selectEven = () => {
    const evens = new Set(pages.map((p) => p.pageNumber).filter((n) => n % 2 === 0));
    setSelectedPages(evens);
    updateRangeFromSet(evens);
  };

  const selectOdd = () => {
    const odds = new Set(pages.map((p) => p.pageNumber).filter((n) => n % 2 === 1));
    setSelectedPages(odds);
    updateRangeFromSet(odds);
  };

  const updateRangeFromSet = (set: Set<number>) => {
    const sorted = Array.from(set).sort((a, b) => a - b);
    if (sorted.length === 0) {
      setRangeInput('');
      return;
    }

    // Convert to ranges like "1-3, 5, 8-10"
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = sorted[i];
        prev = sorted[i];
      }
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    setRangeInput(ranges.join(', '));
  };

  const handleRangeInputChange = (value: string) => {
    setRangeInput(value);
    // Parse range e.g. "1-3, 5, 7"
    const parts = value.split(',');
    const newSelected = new Set<number>();
    const total = pages.length;

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(total, Math.max(start, end));
          for (let p = min; p <= max; p++) {
            newSelected.add(p);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= total) {
          newSelected.add(p);
        }
      }
    }

    setSelectedPages(newSelected);
  };

  const handleExtract = async () => {
    if (!file) return;
    if (selectedPages.size === 0) {
      setErrorMessage('Veuillez sélectionner au moins une page à extraire.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
      const splitBytes = await splitPdf(file, sortedPages);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadPdf(splitBytes, `${baseName}_extrait_${sortedPages.length}pages.pdf`);

      fireSuccessConfetti();
      setSuccessMessage(`${sortedPages.length} page${sortedPages.length > 1 ? 's ont été extraites' : ' a été extraite'} et téléchargée !`);
    } catch (err) {
      console.error(err);
      setErrorMessage("Une erreur est survenue lors de l'extraction des pages.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Découper & Extraire des pages</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Isolez une ou plusieurs pages spécifiques d'un gros document pour créer un nouveau PDF ciblé.
          </p>
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null);
              setPages([]);
            }}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            Changer de fichier
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

      {/* Main Content */}
      {!file ? (
        <Dropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Sélectionnez le fichier PDF à découper"
          description="Cliquez sur les pages à extraire ou indiquez simplement les numéros de pages"
        />
      ) : (
        <div className="space-y-5">
          {/* File details and selection controls bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 truncate max-w-xs sm:max-w-md" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(file.size)} • {selectedPages.size} / {pages.length} pages sélectionnées
                  </p>
                </div>
              </div>

              {/* Quick filter buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={selectAll}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Tout cocher
                </button>
                <button
                  onClick={selectNone}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Tout décocher
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={selectOdd}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Impaires
                </button>
                <button
                  onClick={selectEven}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Paires
                </button>
              </div>
            </div>

            {/* Range input */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-purple-600" />
                <span>Intervalles de pages :</span>
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => handleRangeInputChange(e.target.value)}
                placeholder="Exemple : 1-3, 5, 8-10"
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
              />
              <span className="text-[11px] text-slate-400">
                (Astuce: cliquez directement sur les miniatures ci-dessous)
              </span>
            </div>
          </div>

          {/* Thumbnails Grid */}
          {isLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-3" />
              <p className="text-base font-bold text-slate-800">Chargement des pages...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {pages.map((page) => {
                const isSelected = selectedPages.has(page.pageNumber);

                return (
                  <div
                    key={page.pageNumber}
                    onClick={() => togglePageSelection(page.pageNumber)}
                    className={`relative group bg-white rounded-2xl border-2 transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md cursor-pointer select-none ${
                      isSelected
                        ? 'border-purple-600 ring-2 ring-purple-500/20'
                        : 'border-slate-200/80 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Header */}
                    <div className={`px-3 py-2 border-b flex items-center justify-between text-xs ${
                      isSelected ? 'bg-purple-50/80 border-purple-100' : 'bg-slate-50/80 border-slate-100'
                    }`}>
                      <span className={`font-bold ${isSelected ? 'text-purple-900' : 'text-slate-600'}`}>
                        Page {page.pageNumber}
                      </span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-purple-600 text-white' : 'border border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Preview Image */}
                    <div className="aspect-3/4 p-3 flex items-center justify-center bg-slate-100/40">
                      <img
                        src={page.thumbnailUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="max-h-full max-w-full object-contain shadow-xs rounded-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Download Bar */}
          {!isLoading && (
            <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl flex items-center justify-between gap-4 z-20">
              <div className="text-xs sm:text-sm text-slate-600 font-medium">
                <span className="font-bold text-purple-700 text-base">{selectedPages.size}</span> page{selectedPages.size > 1 ? 's sélectionnées' : ' sélectionnée'} sur {pages.length}.
              </div>

              <button
                onClick={handleExtract}
                disabled={isProcessing || selectedPages.size === 0}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Extraction en cours...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Extraire les {selectedPages.size} pages</span>
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
