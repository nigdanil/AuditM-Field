# Localization

AuditM-Field includes a localization layer for English and Russian UI.

---

## Stack

The current implementation uses:

- `i18next`;
- `react-i18next`;
- local JSON translation files;
- `LanguageSwitcher`;
- `LegacyUiLocalizer` for gradual localization of existing UI.

---

## Location

```text
src/shared/i18n/
  index.ts
  i18next.d.ts
  LegacyUiLocalizer.tsx
  legacyUiTranslations.ts
  locales/
    en/
      common.json
      dashboard.json
      inspections.json
      annotator.json
      settings.json
    ru/
      common.json
      dashboard.json
      inspections.json
      annotator.json
      settings.json
```

Language switcher:

```text
src/features/language-switcher/LanguageSwitcher.tsx
```

Header integration:

```text
src/widgets/app-header/AppHeader.tsx
```

---

## Offline behavior

Localization works offline because translation resources are bundled into the frontend application.

No remote translation service is required.

---

## Current localized areas

* App header navigation.
* Dashboard.
* Inspections list.
* Photo annotator entry page.
* Settings page.
* Part of annotator-related UI.

---

## Conventions

Use translation namespaces by UI/domain area:

| Namespace     | Purpose                                      |
| ------------- | -------------------------------------------- |
| `common`      | shared labels, navigation and common UI text |
| `dashboard`   | dashboard page                               |
| `inspections` | inspections list and inspection-related UI   |
| `annotator`   | photo annotator and annotator entry page     |
| `settings`    | settings page                                |

Example:

```tsx
const { t } = useTranslation('dashboard');

return <h1>{t('hero.title')}</h1>;
```

---

## Gradual migration

Some UI was already implemented with hardcoded strings. To avoid rewriting everything at once, the app includes a temporary compatibility layer:

```text
LegacyUiLocalizer
```

This allows the project to migrate page by page.

Long-term target:

* remove hardcoded UI text;
* remove or reduce `LegacyUiLocalizer`;
* keep all user-facing strings in JSON translation files.

---

## Next steps

* Localize remaining Photo Annotator panel strings.
* Localize Export Center.
* Localize Config Manager.
* Localize validation and error messages.
* Add language persistence.
* Add config-level language metadata.
