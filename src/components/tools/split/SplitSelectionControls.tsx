import React from 'react';
import { useTranslation } from 'react-i18next';
import { Scissors } from 'lucide-react';

interface SplitSelectionControlsProps {
  rangeInput: string;
  onRangeInputChange: (value: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectOdd: () => void;
  onSelectEven: () => void;
}

const FILTER_BUTTON_CLASS =
  'px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer';

export const SplitQuickFilters: React.FC<Omit<SplitSelectionControlsProps, 'rangeInput' | 'onRangeInputChange'>> = ({
  onSelectAll,
  onSelectNone,
  onSelectOdd,
  onSelectEven,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button onClick={onSelectAll} className={FILTER_BUTTON_CLASS}>
        {t('tools.split.selectAll')}
      </button>
      <button onClick={onSelectNone} className={FILTER_BUTTON_CLASS}>
        {t('tools.split.deselectAll')}
      </button>
      <span className="text-slate-300">|</span>
      <button onClick={onSelectOdd} className={FILTER_BUTTON_CLASS}>
        {t('tools.split.odd')}
      </button>
      <button onClick={onSelectEven} className={FILTER_BUTTON_CLASS}>
        {t('tools.split.even')}
      </button>
    </div>
  );
};

export const SplitRangeInput: React.FC<Pick<SplitSelectionControlsProps, 'rangeInput' | 'onRangeInputChange'>> = ({
  rangeInput,
  onRangeInputChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
      <label className="text-xs font-bold text-slate-600 whitespace-nowrap flex items-center gap-1.5">
        <Scissors className="w-3.5 h-3.5 text-purple-600" />
        <span>{t('tools.split.rangeLabel')}</span>
      </label>
      <input
        type="text"
        value={rangeInput}
        onChange={(e) => onRangeInputChange(e.target.value)}
        placeholder={t('tools.split.rangePlaceholder')}
        className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
      />
      <span className="text-[11px] text-slate-400">
        {t('tools.split.rangeTip')}
      </span>
    </div>
  );
};
