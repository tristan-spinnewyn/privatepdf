import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, ShieldCheck, Lock, Info, Sparkles } from 'lucide-react';
import { PrivacyModal } from './PrivacyModal';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  {t('nav.brand')}<span className="text-rose-600">{t('nav.brandHighlight')}</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                  <Sparkles className="w-3 h-3 text-rose-500" />
                  {t('nav.badgeSelfHosted')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight hidden sm:block">
                {t('nav.subtitle')}
              </p>
            </div>
          </div>

          {/* Controls: Language + Privacy Badge */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <LanguageSwitcher />

            <button
              onClick={() => setShowPrivacyModal(true)}
              className="group flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">{t('nav.privacyBadge')}</span>
              <span className="md:hidden">{t('nav.privacyBadgeMobile')}</span>
              <Info className="w-3.5 h-3.5 text-emerald-600 opacity-60 group-hover:opacity-100" />
            </button>

            <div className="hidden lg:flex items-center space-x-1.5 text-slate-400 text-xs px-2 py-1 bg-slate-100/60 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('nav.zeroData')}</span>
            </div>
          </div>
        </div>
      </header>

      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </>
  );
};
