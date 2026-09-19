import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, X, Cpu, WifiOff, FileCheck, Heart } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 text-left transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t('privacyModal.title')}</h3>
              <p className="text-xs text-slate-500 font-medium">{t('privacyModal.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start space-x-3.5">
            <Cpu className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">{t('privacyModal.cpuTitle')}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {t('privacyModal.cpuDesc')}
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start space-x-3.5">
            <WifiOff className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">{t('privacyModal.offlineTitle')}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {t('privacyModal.offlineDesc')}
              </p>
            </div>
          </div>

          <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 flex items-start space-x-3.5">
            <FileCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">{t('privacyModal.privacyTitle')}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {t('privacyModal.privacyDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <span>{t('privacyModal.footerNote')}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline ml-1" />
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {t('privacyModal.closeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
