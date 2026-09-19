import React from 'react';
import { useTranslation } from 'react-i18next';
import { Files, Layers, Scissors, PenTool, Image as ImageIcon, Sparkles, FileImage } from 'lucide-react';
import type { ToolType } from '../../types';

interface ToolNavigationProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

interface ToolDefinition {
  id: ToolType;
  translationKey: string;
  icon: React.ElementType;
  colorClass: string;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'merge',
    translationKey: 'tools.merge.shortLabel',
    icon: Files,
    colorClass: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'organize',
    translationKey: 'tools.organize.shortLabel',
    icon: Layers,
    colorClass: 'from-amber-500 to-orange-600',
  },
  {
    id: 'split',
    translationKey: 'tools.split.shortLabel',
    icon: Scissors,
    colorClass: 'from-purple-500 to-pink-600',
  },
  {
    id: 'sign',
    translationKey: 'tools.sign.shortLabel',
    icon: PenTool,
    colorClass: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'image-converter',
    translationKey: 'tools.imageConverter.shortLabel',
    icon: Sparkles,
    colorClass: 'from-violet-600 to-indigo-600',
  },
  {
    id: 'images-to-pdf',
    translationKey: 'tools.imagesToPdf.shortLabel',
    icon: ImageIcon,
    colorClass: 'from-rose-500 to-red-600',
  },
  {
    id: 'pdf-to-images',
    translationKey: 'tools.pdfToImages.shortLabel',
    icon: FileImage,
    colorClass: 'from-teal-500 to-cyan-600',
  },
];

export const ToolNavigation: React.FC<ToolNavigationProps> = ({ activeTool, onSelectTool }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 backdrop-blur-xs rounded-2xl overflow-x-auto no-scrollbar shadow-inner">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`flex-1 min-w-[130px] sm:min-w-0 py-3 px-3.5 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer relative ${
                isActive
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-300/40 ring-1 ring-slate-900/5 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg text-white bg-gradient-to-tr ${tool.colorClass} shadow-xs transition-transform duration-200 ${
                  isActive ? 'scale-105 shadow-sm' : 'opacity-80'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate">{t(tool.translationKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
