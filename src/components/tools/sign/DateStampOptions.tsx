import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';

interface DateStampOptionsProps {
  includeDate: boolean;
  onIncludeDateChange: (includeDate: boolean) => void;
  dateText: string;
  onDateTextChange: (dateText: string) => void;
}

export const DateStampOptions: React.FC<DateStampOptionsProps> = ({
  includeDate,
  onIncludeDateChange,
  dateText,
  onDateTextChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDate}
            onChange={(e) => onIncludeDateChange(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
          />
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{t('tools.sign.addDate')}</span>
          </span>
        </label>
      </div>

      {includeDate && (
        <div className="pt-2">
          <input
            type="text"
            value={dateText}
            onChange={(e) => onDateTextChange(e.target.value)}
            placeholder="19/09/2026"
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {t('tools.sign.dateHelp')}
          </p>
        </div>
      )}
    </div>
  );
};
