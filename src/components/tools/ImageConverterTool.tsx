import React, { useState } from 'react';
import { Dropzone } from '../ui/Dropzone';
import { convertImage, downloadFile, downloadZip, isHeicFile } from '../../lib/image-service';
import { formatBytes } from '../../lib/pdf-service';
import { fireSuccessConfetti } from '../../lib/confetti';
import type { ImageFormat, ImageConversionItem } from '../../types';
import {
  RefreshCw,
  Download,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Archive,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const FORMAT_OPTIONS: { id: ImageFormat; label: string; desc: string }[] = [
  { id: 'jpg', label: 'JPG', desc: 'Photos & compression standard' },
  { id: 'png', label: 'PNG', desc: 'Sans perte & transparence' },
  { id: 'webp', label: 'WEBP', desc: 'Format web ultra-léger' },
  { id: 'avif', label: 'AVIF', desc: 'Next-gen haute efficacité' },
  { id: 'ico', label: 'ICO', desc: 'Favicon & icônes' },
  { id: 'bmp', label: 'BMP', desc: 'Bitmap brut sans compression' },
];

export const ImageConverterTool: React.FC = () => {
  const [items, setItems] = useState<ImageConversionItem[]>([]);
  const [globalTargetFormat, setGlobalTargetFormat] = useState<ImageFormat>('jpg');
  const [quality, setQuality] = useState<number>(0.90);
  const [scale, setScale] = useState<number>(1.0);
  const [icoSize, setIcoSize] = useState<number>(64);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    const newItems: ImageConversionItem[] = files.map((file) => {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'IMG';
      const isIos = isHeicFile(file);

      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        originalFormat: isIos ? 'HEIC (iOS)' : ext,
        size: file.size,
        previewUrl: isIos ? '' : URL.createObjectURL(file),
        targetFormat: globalTargetFormat,
        status: 'pending',
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const updateItemTargetFormat = (id: string, format: ImageFormat) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, targetFormat: format, status: 'pending' } : it))
    );
  };

  const applyGlobalFormat = (format: ImageFormat) => {
    setGlobalTargetFormat(format);
    setItems((prev) => prev.map((it) => ({ ...it, targetFormat: format, status: 'pending' })));
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item?.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      return prev.filter((it) => it.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl);
    });
    setItems([]);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleConvertAll = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const updatedItems = [...items];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      try {
        setItems((current) =>
          current.map((it, idx) => (idx === i ? { ...it, status: 'processing' } : it))
        );

        const result = await convertImage(item.file, {
          targetFormat: item.targetFormat,
          quality,
          scale,
          icoSize: item.targetFormat === 'ico' ? icoSize : undefined,
        });

        const convertedUrl = URL.createObjectURL(result.blob);

        updatedItems[i] = {
          ...item,
          status: 'done',
          convertedBlob: result.blob,
          convertedUrl,
          convertedSize: result.blob.size,
          name: result.filename,
        };

        setItems([...updatedItems]);
      } catch (err: unknown) {
        console.error(err);
        updatedItems[i] = {
          ...item,
          status: 'error',
          error: 'Échec de conversion',
        };
        setItems([...updatedItems]);
      }
    }

    setIsProcessing(false);
    fireSuccessConfetti();
    setSuccessMessage('Conversion terminée avec succès !');
  };

  const handleDownloadSingle = (item: ImageConversionItem) => {
    if (item.convertedBlob) {
      downloadFile(item.convertedBlob, item.name);
    }
  };

  const handleDownloadAllZip = async () => {
    const readyItems = items.filter((it) => it.status === 'done' && it.convertedBlob);
    if (readyItems.length === 0) return;

    const filesToZip = readyItems.map((it) => ({
      name: it.name,
      blob: it.convertedBlob!,
    }));

    await downloadZip(filesToZip, 'images_converties.zip');
  };

  const doneCount = items.filter((it) => it.status === 'done').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Convertisseur d'Images Universel</h2>
            <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              Photos iOS HEIC incluses
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Convertissez instantanément vos photos et images entre tous les formats (JPG, PNG, WebP, AVIF, HEIC, SVG, BMP, ICO) 100% en local.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            Tout effacer
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
      {items.length === 0 ? (
        <Dropzone
          onFilesSelected={handleFilesSelected}
          accept="image/*,.heic,.heif,.svg,.bmp,.ico"
          multiple={true}
          title="Sélectionnez ou déposez vos images ici"
          description="Tous formats acceptés : JPG, PNG, WebP, AVIF, HEIC/HEIF (iPhone), SVG, BMP, ICO"
        />
      ) : (
        <div className="space-y-5">
          {/* Global Options Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Convertir toutes les images vers :</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FORMAT_OPTIONS.map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => applyGlobalFormat(fmt.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        globalTargetFormat === fmt.id
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 ring-2 ring-indigo-500/20'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality slider (only for lossy formats) */}
              {(globalTargetFormat === 'jpg' || globalTargetFormat === 'webp' || globalTargetFormat === 'avif') && (
                <div className="w-full md:w-56">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Qualité :</span>
                    <span className="font-mono text-indigo-600">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={Math.round(quality * 100)}
                    onChange={(e) => setQuality(parseInt(e.target.value, 10) / 100)}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}

              {/* ICO Size options */}
              {globalTargetFormat === 'ico' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Taille de l'icône :
                  </label>
                  <select
                    value={icoSize}
                    onChange={(e) => setIcoSize(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value={16}>16 × 16 px (Favicon petit)</option>
                    <option value={32}>32 × 32 px (Favicon standard)</option>
                    <option value={48}>48 × 48 px (Windows standard)</option>
                    <option value={64}>64 × 64 px (Haute résolution)</option>
                    <option value={128}>128 × 128 px (Grand)</option>
                    <option value={256}>256 × 256 px (HD Windows)</option>
                  </select>
                </div>
              )}

              {/* Scale / Resize */}
              {globalTargetFormat !== 'ico' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dimension :
                  </label>
                  <select
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value={1.0}>100% (Taille originale)</option>
                    <option value={0.75}>75% de la taille</option>
                    <option value={0.50}>50% (Réduire de moitié)</option>
                    <option value={0.25}>25% (Miniature)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* List of Files to Convert */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{items.length} {items.length > 1 ? 'images sélectionnées' : 'image sélectionnée'}</span>
              <span>{doneCount} / {items.length} convertie{doneCount > 1 ? 's' : ''}</span>
            </div>

            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  {/* File information */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {item.previewUrl ? (
                        <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-extrabold text-indigo-600 uppercase">HEIC</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate max-w-xs sm:max-w-md" title={item.name}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {item.originalFormat}
                        </span>
                        <span>{formatBytes(item.size)}</span>

                        {item.convertedSize !== undefined && (
                          <>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                              {formatBytes(item.convertedSize)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Format switch */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <select
                      value={item.targetFormat}
                      onChange={(e) => updateItemTargetFormat(item.id, e.target.value as ImageFormat)}
                      disabled={isProcessing}
                      className="px-2.5 py-1.5 text-xs font-bold uppercase bg-slate-100 border border-slate-200 rounded-xl"
                    >
                      {FORMAT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          vers {f.label}
                        </option>
                      ))}
                    </select>

                    {item.status === 'done' && (
                      <button
                        onClick={() => handleDownloadSingle(item)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        title="Télécharger l'image convertie"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={isProcessing}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Supprimer"
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
                <span>Ajouter d'autres photos ou images</span>
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.svg,.bmp,.ico"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action bottom bar */}
          <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
            <div className="text-xs sm:text-sm text-slate-600 font-medium">
              {doneCount > 0 ? (
                <span className="text-emerald-700 font-bold">
                  {doneCount} image{doneCount > 1 ? 's prêtes' : ' prête'} au téléchargement.
                </span>
              ) : (
                <span>Cliquez sur Convertir pour lancer le traitement local.</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {doneCount > 1 && (
                <button
                  onClick={handleDownloadAllZip}
                  className="flex-1 sm:flex-initial px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Archive className="w-4 h-4" />
                  <span>Tout télécharger (ZIP)</span>
                </button>
              )}

              <button
                onClick={handleConvertAll}
                disabled={isProcessing || items.length === 0}
                className="flex-1 sm:flex-initial px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Conversion locale...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Convertir les {items.length} images</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
