import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supportedLanguages } from '../i18n';
import { useLoadUserPreferences, useSaveLanguagePreference } from '../api/hooks/useAPIHooks';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { data: prefs } = useLoadUserPreferences();
  const { mutate: saveLang } = useSaveLanguagePreference();

  // Sync language from backend when preferences load
  useEffect(() => {
    if (prefs?.preferredLanguage && prefs.preferredLanguage !== i18n.language) {
      i18n.changeLanguage(prefs.preferredLanguage);
    }
  }, [prefs]);

  const currentLang = supportedLanguages.find(l => l.code === i18n.language) || supportedLanguages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    saveLang({ preferredLanguage: code });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-surface-100 dark:border-slate-800 safe-area-top">
        <div className="px-responsive py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('settings.language')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('settings.selectLanguage')}
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="px-responsive py-6 space-y-4">
        {/* Current Language */}
        <div className="glass-card p-4 rounded-2xl">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t('settings.selectLanguage')}</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentLang.flag}</span>
            <span className="font-semibold text-slate-900 dark:text-white">{currentLang.name}</span>
          </div>
        </div>
        
        {/* Language Options */}
        <div className="space-y-2">
          {supportedLanguages.map((lang) => (
            <motion.button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                i18n.language === lang.code
                  ? 'bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-500'
                  : 'bg-white dark:bg-slate-800 border border-surface-200 dark:border-slate-700'
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900 dark:text-white">{lang.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{lang.code.toUpperCase()}</p>
              </div>
              {i18n.language === lang.code && (
                <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </motion.button>
          ))}
        </div>
        
        {/* Info */}
        <div className="p-4 bg-surface-100 dark:bg-slate-800 rounded-2xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            🌍 safetyMEG is available in {supportedLanguages.length} languages to serve global teams.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LanguageSelector;
