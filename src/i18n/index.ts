import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import { detectInitialLanguage, saveLanguage, type AppLanguage } from './language-storage';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: detectInitialLanguage(navigator.language),
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

export function changeLanguage(lang: AppLanguage) {
  i18n.changeLanguage(lang);
  saveLanguage(lang);
}

export default i18n;
