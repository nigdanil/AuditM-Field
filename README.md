# AuditM-Field

**AuditM-Field** is an open-source configurable offline-first PWA for field photo audits, image annotation, dynamic checklists, ZIP export/import, external transport workflows, and AI suggestion review.

The main idea: the app is not hardcoded for one business process. Audit configuration is loaded from JSON, while the PWA acts as a reusable frontend core.

```text
Config-first
+ Gallery-first
+ Offline-first
+ Frontend-first
+ Adapter-based
+ AI-ready
```

---

## What it does

AuditM-Field helps users:

- create local field inspections;
- import photos from gallery;
- annotate image areas;
- fill dynamic forms from JSON config;
- store data locally in IndexedDB;
- export inspections as self-contained ZIP packages;
- import ZIP packages back into local storage;
- send packages to external HTTP/Webhook/n8n workflows;
- import AI-generated annotation suggestions;
- review AI suggestions manually before accepting or rejecting them.

---

## Use cases

AuditM-Field is not retail-only. It can be configured for many scenarios:

| Area | Example |
| --- | --- |
| Retail | shelf audits, price tags, POS materials |
| Warehouse | pallet inspection, storage zones, damaged goods |
| Manufacturing | equipment checks, defects, labels |
| Field service | repair reports, photo evidence |
| Construction | work stage control, issue tracking |
| Agriculture | field, plant, machinery inspection |
| Safety | risks, violations, incidents |

---

## Core workflow

```text
Load audit config
  -> Create inspection
  -> Import photos from gallery
  -> Annotate image zones
  -> Fill dynamic checklists
  -> Save locally
  -> Export ZIP / upload to backend or n8n
  -> Import AI suggestions
  -> Human review
```

---

## Key features

### Config-first audits

Audit scenarios are defined by JSON config:

- photo types;
- annotation types;
- colors;
- dictionaries;
- inspection-level forms;
- photo-level forms;
- annotation-level forms;
- export settings.

The same frontend can support different domains without changing application code.

### Offline-first local data

The app stores working data locally in the browser:

- inspections;
- photos;
- annotations;
- checklist attributes;
- export jobs;
- storage adapter settings.

### Image annotation

The annotator supports:

- rectangular image annotations;
- annotation type selection;
- colored annotation styles;
- type filtering;
- source filtering;
- dynamic forms per annotation.

### Dynamic forms

Forms are generated from JSON config and support:

- text;
- textarea;
- number;
- select;
- multiselect;
- boolean;
- radio;
- date.

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

- local browser download;
- HTTP upload;
- Webhook upload;
- mock upload server for local testing.

The HTTP/Webhook contract is designed for n8n or backend integration.

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

- review pending AI suggestions;
- accept AI suggestions as human-reviewed annotations;
- reject AI suggestions;
- clear pending suggestions;
- inspect AI metadata.

---

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React |
| Language | TypeScript |
| Build | Vite |
| PWA | vite-plugin-pwa |
| Styling | Tailwind CSS |
| Local DB | Dexie / IndexedDB |
| Annotation | Annotorious |
| Forms | React Hook Form |
| Validation | Zod |
| Export | JSZip |
| Icons | lucide-react |
| Tests | Vitest / Testing Library |

---

## Public demo

GitHub Pages demo:

```text
https://nigdanil.github.io/AuditM-Field/
```

Deployment guide:

```text
docs/github-pages.md
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

## Mock upload server

AuditM-Field includes a local mock server for testing HTTP/Webhook upload without a real backend.

```bash
npm run mock:upload
```

Default endpoint:

```text
http://localhost:8787/upload
```

Use it in:

```text
Export Center -> Storage adapter -> HTTP upload URL
```

---

## Demo flow

See:

```text
docs/demo-flow.md
```

Short version:

```text
1. Open Configs.
2. Load Retail Shelf Audit demo config.
3. Create inspection.
4. Import a photo.
5. Fill inspection/photo checklists.
6. Open Annotator.
7. Draw annotations.
8. Fill annotation form.
9. Export ZIP.
10. Import ZIP back.
11. Test HTTP upload with mock server.
12. Generate and review AI suggestions.
```

---

## Documentation

| Document | Purpose |
| --- | --- |
| `ROADMAP.md` | MVP roadmap and status |
| `ARCHITECTURE.md` | Architecture overview |
| `docs/demo-flow.md` | Step-by-step demo script |
| `docs/configuration.md` | Audit config format |
| `docs/config-registry.md` | GitHub config registry |
| `docs/export-format.md` | ZIP export/import structure |
| `docs/transport-contract.md` | HTTP/Webhook/n8n contract |
| `docs/mock-upload-server.md` | Local mock server usage |
| `docs/n8n-workflow-example.md` | n8n workflow example |
| `docs/ai-suggestions-import.md` | AI suggestions import/review |
| `docs/screenshots.md` | Suggested screenshots for README/portfolio |

---

## Project status

Current status:

```text
MVP-11.3 complete:
AI suggestions import and human review workflow.
```

Next recommended stage:

```text
MVP-12:
Open-source readiness / docs polish.
```

---

## Repository structure

```text
src/
  app/
  core/
  entities/
  features/
  pages/
  services/
  widgets/

docs/
  architecture and workflow documentation

public/
  demo configs and demo transport files

tools/
  local development utilities
```

---

## License

This project is intended to be released as open-source.

Recommended license:

```text
MIT
```

See `LICENSE`.

---

## Positioning

AuditM-Field is a configurable frontend core for field photo audits and structured visual evidence collection.

It can be used as:

- a standalone local-first PWA;
- a demo/portfolio project;
- a frontend layer for corporate audit systems;
- a data collection tool for AI/CV/OCR workflows;
- a prototype base for external backend integrations.
