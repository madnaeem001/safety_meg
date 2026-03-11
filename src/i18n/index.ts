import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

// Get saved language or detect from browser
const getInitialLanguage = (): string => {
  const saved = localStorage.getItem('safetymeg_language');
  if (saved && ['en', 'es', 'fr'].includes(saved)) {
    return saved;
  }
  
  // Detect browser language
  const browserLang = navigator.language.split('-')[0];
  if (['en', 'es', 'fr'].includes(browserLang)) {
    return browserLang;
  }
  
  return 'en';
};

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr }
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('safetymeg_language', lng);
  document.documentElement.lang = lng;
});

export default i18n;
