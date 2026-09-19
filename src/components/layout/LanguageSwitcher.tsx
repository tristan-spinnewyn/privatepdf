import React from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('en') ? 'en' : 'fr';

  const toggleLang = (lang: 'fr' | 'en') => {
    changeLanguage(lang);
  };

  return (
    <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/80 text-xs font-bold">
      <div className="pl-1.5 pr-0.5 text-slate-400">
        <Globe className="w-3.5 h-3.5" />
      </div>
      <button
        onClick={() => toggleLang('fr')}
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
          currentLang === 'fr'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => toggleLang('en')}
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
          currentLang === 'en'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        EN
      </button>
    </div>
  );
};
