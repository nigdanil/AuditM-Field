import 'i18next';

import annotator from './locales/en/annotator.json';
import common from './locales/en/common.json';
import dashboard from './locales/en/dashboard.json';
import inspections from './locales/en/inspections.json';
import settings from './locales/en/settings.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      annotator: typeof annotator;
      common: typeof common;
      dashboard: typeof dashboard;
      inspections: typeof inspections;
      settings: typeof settings;
    };
  }
}
