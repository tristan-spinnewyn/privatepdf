import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import type { PdfPageImage } from '../../../services/pdf';
import { formatBytes } from '../../../utils/format-bytes';

interface ExtractedImageCardProps {
  image: PdfPageImage;
  onDownload: (image: PdfPageImage) => void;
}

export const ExtractedImageCard: React.FC<ExtractedImageCardProps> = ({ image, onDownload }) => {
  const { t } = useTranslation();

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400 transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700">Page {image.pageNumber}</span>
        <span className="text-[10px] text-slate-400">{image.width}×{image.height}</span>
      </div>

      <div className="aspect-3/4 p-2 bg-slate-100/40 flex items-center justify-center overflow-hidden">
        <img
          src={image.dataUrl}
          alt={`Page ${image.pageNumber}`}
          className="max-h-full max-w-full object-contain rounded shadow-xs"
        />
      </div>

      <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-mono">{formatBytes(image.blob.size)}</span>
        <button
          onClick={() => onDownload(image)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
          title={t('tools.pdfToImages.downloadPage')}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('tools.pdfToImages.downloadPage')}</span>
        </button>
      </div>
    </div>
  );
};
