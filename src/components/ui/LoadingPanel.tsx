import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingPanelProps {
  title: string;
  hint?: string;
  spinnerClassName: string;
}

export const LoadingPanel: React.FC<LoadingPanelProps> = ({ title, hint, spinnerClassName }) => (
  <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
    <Loader2 className={`w-10 h-10 animate-spin mb-3 ${spinnerClassName}`} />
    <p className="text-base font-bold text-slate-800">{title}</p>
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);
