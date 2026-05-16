# AuditM-Field

**AuditM-Field** is an open-source configurable offline-first PWA for field photo audits, image annotation, dynamic checklists, ZIP export/import, external transport workflows, localization, and AI suggestion review.

The main idea: the app is not hardcoded for one business process. Audit configuration is loaded from JSON, while the PWA acts as a reusable frontend core for different audit scenarios.

```text
Config-first + Gallery-first + Offline-first + Frontend-first + Adapter-based + AI-ready + i18n-ready
```

---

## What it does

AuditM-Field helps users:

* create local field inspections;
* import photos from gallery;
* annotate image areas;
* assign annotation types and colors from JSON config;
* fill dynamic forms from JSON config;
* store inspections, photos, annotations and form answers locally in IndexedDB;
* export inspections as self-contained ZIP packages;
* import ZIP packages back into local storage;
* send packages to external HTTP/Webhook/n8n workflows;
* import AI-generated annotation suggestions;
* review AI suggestions manually before accepting or rejecting them;
* switch UI language between English and Russian.

---

## Use cases

AuditM-Field is not retail-only. It can be configured for many visual audit scenarios.

| Area          | Example                                                              |
| ------------- | -------------------------------------------------------------------- |
| Retail / FMCG | shelf audits, price tags, POS materials, competitors, share of shelf |
| Warehouse     | pallet inspection, storage zones, damaged goods                      |
| Manufacturing | equipment checks, defects, labels, marking                           |
| Field service | repair reports, before/after photo evidence                          |
| Construction  | work stage control, defects, issue tracking                          |
| Agriculture   | field, plant, machinery inspection                                   |
| Safety        | risks, violations, incidents, checklists                             |

---

## Core workflow

```text
Load audit config
  -> Create inspection
  -> Import photos from gallery
  -> Annotate image zones
  -> Fill dynamic checklists
  -> Save locally in IndexedDB
  -> Export ZIP / upload to backend or n8n
  -> Import AI suggestions
  -> Human review
```

---

## Key features

### Config-first audits

Audit scenarios are defined by JSON config:

* photo types;
* annotation types;
* annotation colors;
* dictionaries;
* inspection-level forms;
* photo-level forms;
* annotation-level forms;
* export settings.

The same frontend can support different domains without changing application code.

### Offline-first local data

The app stores working data locally in the browser:

* inspections;
* photos;
* annotations;
* checklist attributes;
* export jobs;
* storage adapter settings.

### Image annotation

The photo annotator supports:

* rectangular image annotations;
* annotation type selection;
* colored annotation styles;
* visible type filtering;
* annotation source filtering;
* source separation: `human`, `ai`, `imported`;
* pending AI suggestion filtering;
* dynamic annotation forms;
* AI metadata display;
* accept/reject workflow for AI suggestions.

Recent stability improvements:

* annotations are rendered again after navigation between pages;
* saved annotations are restored after page reload;
* annotation `target.source` is normalized for the current `blob:` image URL;
* unchanged annotation geometry is not re-saved to IndexedDB;
* selected annotation state is synchronized between Annotorious and React state;
* after page reload, saved annotation can be selected with one click.

### Dynamic forms

Forms are generated from JSON config and support:

* text;
* textarea;
* number;
* select;
* multiselect;
* boolean;
* radio;
* date.

### Localization

The app now includes an i18n layer based on:

* `i18next`;
* `react-i18next`;
* local JSON translation files;
* language switcher in the header;
* gradual localization support for existing UI through `LegacyUiLocalizer`.

Current languages:

* English;
* Russian.

The localization is compatible with offline-first usage because translation resources are bundled with the app.

### ZIP export/import

AuditM-Field can export a full inspection package:

```text
manifest.json
config.json
inspections/
photos/
annotations/
```

The ZIP can be imported back into the app.

### Storage adapters

Supported delivery options:

* local browser download;
* HTTP upload;
* Webhook upload;
* mock upload server for local testing.

The HTTP/Webhook contract is designed for backend or n8n integration.

### AI-ready workflow

AuditM-Field does not call AI providers directly from the PWA.

Recommended AI workflow:

```text
AuditM-Field PWA
  -> ZIP export
  -> n8n/backend
  -> OCR/CV/LLM/RAG
  -> ai-suggestions.json
  -> AuditM-Field import
  -> human review
```

AI suggestions are imported as annotations with:

```text
source: ai
```

Users can:

* review pending AI suggestions;
* accept AI suggestions as human-reviewed annotations;
* reject AI suggestions;
* clear pending suggestions;
* inspect AI metadata.

---

## Tech stack

| Area       | Technology               |
| ---------- | ------------------------ |
| Frontend   | React                    |
| Language   | TypeScript               |
| Build      | Vite                     |
| PWA        | vite-plugin-pwa          |
| Styling    | Tailwind CSS             |
| Local DB   | Dexie / IndexedDB        |
| Annotation | Annotorious              |
| Forms      | React Hook Form          |
| Validation | Zod                      |
| Export     | JSZip                    |
| i18n       | i18next / react-i18next  |
| Icons      | lucide-react             |
| Tests      | Vitest / Testing Library |

---

## Public demo

GitHub Pages demo:

```text
https://nigdanil.github.io/AuditM-Field/
```

---

## Getting started

### Requirements

```text
Node.js
npm
modern browser
```

### Install

```bash
npm install
```

### Run dev server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

---

## Repository structure

```text
src/
  app/                  routes
  core/                 config schema, validation, config storage
  entities/             domain models: inspection, photo, annotation, export job
  features/             feature-level UI and workflows
  pages/                route pages
  services/             IndexedDB repositories, export/import, storage adapters
  shared/               i18n, common utilities, shared UI
  widgets/              app layout, header, offline banner

public/
  config-registry/      config registry index
  demo-configs/         demo audit configs
  demo-transport/       AI suggestions and n8n/webhook examples
  icons/                PWA icons

docs/
  project documentation and release notes
```

---

## Documentation

| Document                                                         | Purpose                                      |
| ---------------------------------------------------------------- | -------------------------------------------- |
| `ROADMAP.md`                                                     | MVP roadmap and status                       |
| `docs/localization.md`                                           | i18n implementation and conventions          |
| `docs/photo-annotator.md`                                        | Photo annotator behavior and stability notes |
| `docs/release-notes/mvp-12-localization-annotation-stability.md` | Current release notes                        |

---

## Project status

Current local status:

```text
MVP-12.1 complete: localization layer + stable photo annotation workflow.
```

Main completed items:

* RU/EN localization layer;
* header language switcher;
* localized dashboard, inspections, annotator entry and settings pages;
* photo annotator rendering restored after navigation;
* annotation selection stabilized after page reload;
* one-click selection for saved annotations;
* geometry save guard to avoid unnecessary IndexedDB updates;
* AI suggestions review UI preserved.

Next recommended stage:

```text
MVP-13: Open-source readiness, docs polish, screenshots, versioning and release automation.
```

---

## License

This project is released under the MIT License.

See `LICENSE`.

---

## Positioning

AuditM-Field is a configurable frontend core for field photo audits and structured visual evidence collection.

It can be used as:

* a standalone local-first PWA;
* a demo/portfolio project;
* a frontend layer for corporate audit systems;
* a data collection tool for AI/CV/OCR workflows;
* a prototype base for backend, webhook or n8n integrations.
