import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ToolType } from '../../types';
import { TOOLS } from './tool-definitions';

interface ToolNavigationProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

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
