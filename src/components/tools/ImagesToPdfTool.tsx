import React, { useState } from 'react';
import { Dropzone } from '../ui/Dropzone';
import { imagesToPdf, downloadPdf, formatBytes } from '../../lib/pdf-service';
import { fireSuccessConfetti } from '../../lib/confetti';
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  Plus,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export const ImagesToPdfTool: React.FC = () => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [margin, setMargin] = useState<'none' | 'small' | 'normal'>('normal');
  const [outputFileName, setOutputFileName] = useState('mes_images.pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImagesSelected = (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const moveItem = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setItems(newItems);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => {
        if (item.id === id) {
          URL.revokeObjectURL(item.previewUrl);
          return false;
        }
        return true;
      });
      return filtered;
    });
  };

  const clearAll = () => {
    items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    setItems([]);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const files = items.map((it) => it.file);
      const pdfBytes = await imagesToPdf(files, {
        orientation,
        margin,
      });

      const filename = outputFileName.trim() ? outputFileName.trim() : 'mes_images.pdf';
      downloadPdf(pdfBytes, filename);

      fireSuccessConfetti();
      setSuccessMessage(`${items.length} photo${items.length > 1 ? 's converties' : ' convertie'} en PDF A4 avec succès !`);
    } catch (err) {
      console.error(err);
      setErrorMessage("Une erreur est survenue lors de la conversion des images.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Convertir des Images en PDF</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Transformez vos photos de factures, justificatifs ou pièces d'identité en un document PDF A4 propre.
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
          onFilesSelected={handleImagesSelected}
          accept="image/*"
          multiple={true}
          title="Sélectionnez ou glissez vos images ici"
          description="Formats JPG, PNG, WebP acceptés • Standardisé au format A4"
        />
      ) : (
        <div className="space-y-5">
          {/* Settings Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Orientation des pages :
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="auto">Automatique (selon photo)</option>
                <option value="portrait">Portrait (A4 vertical)</option>
                <option value="landscape">Paysage (A4 horizontal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Marges de page :
              </label>
              <select
                value={margin}
                onChange={(e) => setMargin(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="normal">Marge standard (recommandé)</option>
                <option value="small">Petite marge</option>
                <option value="none">Sans marge (Plein cadre)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nom du PDF :
              </label>
              <input
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
                placeholder="mes_images.pdf"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          {/* Grid of Images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-rose-300 transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md"
              >
                {/* Header */}
                <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Page {index + 1}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{formatBytes(item.size)}</span>
                </div>

                {/* Preview Image */}
                <div className="aspect-3/4 p-2 bg-slate-100/50 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain rounded shadow-xs"
                  />
                </div>

                {/* Card footer with actions */}
                <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveItem(index, 'left')}
                      disabled={index === 0}
                      title="Déplacer vers la gauche"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer rounded-lg"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(index, 'right')}
                      disabled={index === items.length - 1}
                      title="Déplacer vers la droite"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer rounded-lg"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    title="Supprimer l'image"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add more button */}
          <div className="flex justify-center">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-2xl transition-colors cursor-pointer shadow-xs">
              <Plus className="w-4 h-4 text-rose-600" />
              <span>Ajouter d'autres photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) handleImagesSelected(Array.from(e.target.files));
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Download bar */}
          <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl flex items-center justify-between gap-4 z-20">
            <div className="text-xs sm:text-sm text-slate-600 font-medium">
              <span className="font-bold text-slate-900">{items.length}</span> image{items.length > 1 ? 's' : ''} prêtes à être converties en PDF A4.
            </div>

            <button
              onClick={handleConvert}
              disabled={isProcessing || items.length === 0}
              className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Conversion en cours...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Générer et Télécharger le PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
