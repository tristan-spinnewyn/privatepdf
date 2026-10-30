import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

interface SplitPageCardProps {
  pageNumber: number;
  thumbnailUrl: string;
  isSelected: boolean;
  onToggle: (pageNumber: number) => void;
}

export const SplitPageCard: React.FC<SplitPageCardProps> = ({ pageNumber, thumbnailUrl, isSelected, onToggle }) => {
  const { t } = useTranslation();

  return (
    <div
      onClick={() => onToggle(pageNumber)}
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
          {t('tools.organize.page')} {pageNumber}
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
          src={thumbnailUrl}
          alt={`${t('tools.organize.page')} ${pageNumber}`}
          className="max-h-full max-w-full object-contain shadow-xs rounded-sm"
        />
      </div>
    </div>
  );
};
