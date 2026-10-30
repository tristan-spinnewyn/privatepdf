import React from 'react';

interface ToolHeaderProps {
  title: string;
  description: string;
  badge?: string;
  children?: React.ReactNode; // header actions (clear, change file...)
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ title, description, badge, children }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      {badge ? (
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
            {badge}
          </span>
        </div>
      ) : (
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      )}
      <p className="text-sm text-slate-500 mt-0.5">{description}</p>
    </div>

    {children}
  </div>
);

interface HeaderActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'neutral' | 'danger';
}

export const HeaderActionButton: React.FC<HeaderActionButtonProps> = ({ label, onClick, variant = 'neutral' }) => (
  <button
    onClick={onClick}
    className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-auto ${
      variant === 'danger'
        ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`}
  >
    {label}
  </button>
);
