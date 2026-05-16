import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { type SupportedLanguage } from '../../shared/i18n';

function normalizeLanguage(language: string | undefined): SupportedLanguage {
  return language?.startsWith('ru') ? 'ru' : 'en';
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  function handleLanguageChange(event: ChangeEvent<HTMLSelectElement>) {
    void i18n.changeLanguage(event.target.value as SupportedLanguage);
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-slate-300">
      <span className="sr-only">{t('language.label')}</span>

      <select
        aria-label={t('language.label')}
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="bg-transparent text-sm font-medium text-slate-200 outline-none"
      >
        <option className="bg-slate-950 text-slate-100" value="en">
          {t('language.en')}
        </option>
        <option className="bg-slate-950 text-slate-100" value="ru">
          {t('language.ru')}
        </option>
      </select>
    </label>
  );
}
