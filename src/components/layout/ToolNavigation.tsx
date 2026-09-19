import React from 'react';
import { Files, Layers, Scissors, PenTool, Image as ImageIcon } from 'lucide-react';
import type { ToolType } from '../../types';

interface ToolNavigationProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

interface ToolDefinition {
  id: ToolType;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  colorClass: string;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'merge',
    label: 'Fusionner des PDF',
    shortLabel: 'Fusionner',
    description: 'Combiner plusieurs PDF dans l’ordre de votre choix',
    icon: Files,
    colorClass: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'organize',
    label: 'Organiser & Pivoter',
    shortLabel: 'Organiser',
    description: 'Faire pivoter, supprimer ou réordonner les pages',
    icon: Layers,
    colorClass: 'from-amber-500 to-orange-600',
  },
  {
    id: 'split',
    label: 'Découper & Extraire',
    shortLabel: 'Découper',
    description: 'Sélectionner des pages ou des plages à exporter',
    icon: Scissors,
    colorClass: 'from-purple-500 to-pink-600',
  },
  {
    id: 'sign',
    label: 'Signer & Dater',
    shortLabel: 'Signer',
    description: 'Dessiner votre signature et poser la date directement',
    icon: PenTool,
    colorClass: 'from-emerald-500 to-teal-600',
    badge: 'Populaire',
  },
  {
    id: 'images-to-pdf',
    label: 'Images en PDF',
    shortLabel: 'Images -> PDF',
    description: 'Convertir vos photos (JPG, PNG, WebP) en PDF A4 propre',
    icon: ImageIcon,
    colorClass: 'from-rose-500 to-red-600',
  },
];

export const ToolNavigation: React.FC<ToolNavigationProps> = ({ activeTool, onSelectTool }) => {
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
              <span className="truncate">{tool.shortLabel}</span>

              {tool.badge && (
                <span className="hidden xl:inline-block absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs">
                  {tool.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
