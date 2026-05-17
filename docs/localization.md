# Localization

AuditM-Field includes a localization layer for English and Russian UI.

---

## Stack

The current implementation uses:

* `i18next`;
* `react-i18next`;
* local JSON translation files;
* `LanguageSwitcher`;
* `LegacyUiLocalizer` for gradual localization of existing UI.

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
* Login page.
* Dashboard.
* Role labels.
* Common actions.
* Common dynamic form labels.
* Inspections list.
* Inspection detail page.
* Inspection checklist and photo checklist UI.
* Photo gallery actions.
* Photo annotator entry page.
* Photo annotator workspace.
* Annotation filters.
* AI review controls.
* Annotation dynamic form.
* Settings page.
* Part of legacy UI through `LegacyUiLocalizer`.

---

## Namespaces

Use translation namespaces by UI/domain area:

| Namespace     | Purpose                                                    |
| ------------- | ---------------------------------------------------------- |
| `common`      | shared labels, navigation, roles, login and common UI text |
| `dashboard`   | dashboard page and role workflow cards                     |
| `inspections` | inspections list and inspection-related UI                 |
| `annotator`   | photo annotator and annotator entry page                   |
| `settings`    | settings page                                              |

Example:

```tsx
const { t } = useTranslation('dashboard');

return <h1>{t('hero.title')}</h1>;
```

For shared role labels:

```tsx
const { t } = useTranslation(['dashboard', 'common']);

t(`roles.${role}`, { ns: 'common' });
```

---

## Typed translation keys

Some pages use strict TypeScript typing for translation keys.

When defining arrays of translation keys, prefer:

```ts
const items = [
  'quickActions.inspections.title',
  'quickActions.inspections.description',
] as const;
```

or:

```ts
const quickActions = [
  {
    labelKey: 'quickActions.inspections.title',
    descriptionKey: 'quickActions.inspections.description',
  },
] as const;
```

This prevents keys from being widened to `string` and keeps `t(...)` compatible with typed i18next declarations.

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
* keep all user-facing strings in JSON translation files;
* keep config-provided labels separate from app UI translations.

---

## Read-only and role-related text

Role-based UI messages should be localized.

Examples:

```text
Current role: Supervisor
For the current role, this form is read-only.
View markup
Read-only mode
```

These texts should not be hardcoded inside React components.

---

## Next steps

* Localize Export Center.
* Localize Config Manager.
* Localize validation and error messages.
* Add language persistence.
* Add config-level language metadata.
* Add translation coverage checklist.
* Add tests for i18n initialization.
* Add script to detect hardcoded Russian/English UI strings.
