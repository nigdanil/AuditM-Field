import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enAnnotator from './locales/en/annotator.json';
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enInspections from './locales/en/inspections.json';
import enSettings from './locales/en/settings.json';
import ruAnnotator from './locales/ru/annotator.json';
import ruCommon from './locales/ru/common.json';
import ruDashboard from './locales/ru/dashboard.json';
import ruInspections from './locales/ru/inspections.json';
import ruSettings from './locales/ru/settings.json';

export const supportedLanguages = ['en', 'ru'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

const LANGUAGE_STORAGE_KEY = 'auditm-field.language';

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return value === 'en' || value === 'ru';
}

function readStoredLanguage(): SupportedLanguage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(savedLanguage) ? savedLanguage : null;
  } catch {
    return null;
  }
}

function getBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return window.navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function getInitialLanguage(): SupportedLanguage {
  return readStoredLanguage() ?? getBrowserLanguage();
}

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      annotator: enAnnotator,
      common: enCommon,
      dashboard: enDashboard,
      inspections: enInspections,
      settings: enSettings,
    },
    ru: {
      annotator: ruAnnotator,
      common: ruCommon,
      dashboard: ruDashboard,
      inspections: ruInspections,
      settings: ruSettings,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['annotator', 'common', 'dashboard', 'inspections', 'settings'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

i18n.on('languageChanged', (language) => {
  if (typeof window === 'undefined' || !isSupportedLanguage(language)) {
    return;
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore localStorage errors in restricted browser modes.
  }
});

export default i18n;
