import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';

const savedLang = localStorage.getItem('app_language') || (navigator.language.startsWith('en') ? 'en' : 'fr');

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

export function changeLanguage(lang: 'fr' | 'en') {
  i18n.changeLanguage(lang);
  localStorage.setItem('app_language', lang);
}

export default i18n;
