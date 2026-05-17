# AuditM-Field

**AuditM-Field** is an open-source configurable offline-first PWA for field photo audits, visual image annotation, dynamic checklists, ZIP export/import, external transport workflows, role-based review scenarios, RU/EN localization, and AI suggestion review.

The main idea: the app is not hardcoded for one business process. Audit configuration is loaded from JSON, while the PWA acts as a reusable frontend core.

```text
Config-first
+ Gallery-first
+ Offline-first
+ Frontend-first
+ Role-aware
+ Adapter-based
+ AI-ready
```

---

## What it does

AuditM-Field helps users:

* sign in through local mock authorization for demo role scenarios;
* work as a merchandiser, supervisor, administrator, or viewer;
* create local field inspections;
* import photos from gallery;
* fill inspection-level and photo-level dynamic checklists;
* annotate image areas;
* view supervisor markup in read-only mode when the role does not allow editing;
* store data locally in IndexedDB;
* export inspections as self-contained ZIP packages;
* import ZIP packages back into local storage;
* send packages to external HTTP/Webhook/n8n workflows;
* import AI-generated annotation suggestions;
* review AI suggestions manually before accepting or rejecting them;
* switch UI language between English and Russian.

---

## Use cases

AuditM-Field is not retail-only. It can be configured for many scenarios:

| Area          | Example                                                   |
| ------------- | --------------------------------------------------------- |
| Retail        | shelf audits, price tags, POS materials, competitor zones |
| Warehouse     | pallet inspection, storage zones, damaged goods           |
| Manufacturing | equipment checks, defects, labels                         |
| Field service | repair reports, before/after photo evidence               |
| Construction  | work stage control, issue tracking                        |
| Agriculture   | field, plant, machinery inspection                        |
| Safety        | risks, violations, incidents                              |

---

## Core workflow

```text
Login as role
  -> Load audit config
  -> Create inspection
  -> Import photos from gallery
  -> Fill inspection/photo checklists
  -> Annotate image zones
  -> Supervisor reviews and marks issues
  -> Merchandiser views markup without editing it
  -> Save locally
  -> Export ZIP / upload to backend or n8n
  -> Import AI suggestions
  -> Human review
```

---

## Role-based workflow

Current MVP includes local mock authorization and role-aware UI.

| Role         | Main purpose                                | Current behavior                                                                                                                        |
| ------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Merchandiser | Field photo capture and correction workflow | Can create inspections, upload photos, view supervisor markup, and fill allowed checklists. Supervisor annotation editing is read-only. |
| Supervisor   | Review and visual markup                    | Can open inspections, review photos, create/edit/delete annotations, fill annotation forms, and accept/reject AI suggestions.           |
| Admin        | Demo/config/export management               | Can access all major screens and test role scenarios.                                                                                   |
| Viewer       | Read-only review                            | Can view available data without changing annotation decisions.                                                                          |

Authorization is currently a frontend/local mock layer for MVP and demo purposes. It can later be replaced by backend auth, SSO, Keycloak, or another provider.

---

## Key features

### Config-first audits

Audit scenarios are defined by JSON config:

* photo types;
* annotation types;
* colors;
* dictionaries;
* inspection-level forms;
* photo-level forms;
* annotation-level forms;
* export settings.

The same frontend can support different domains without changing application code.

### Offline-first local data

The app stores working data locally in the browser:

* configs;
* inspections;
* photos;
* annotations;
* checklist attributes;
* export jobs;
* storage adapter settings.

### Role-aware UI

The application now includes:

* mock users;
* role labels;
* permission checks;
* protected routes;
* role-aware navigation;
* read-only mode for users without edit permission;
* role-specific dashboard workflow hints.

### Image annotation

The annotator supports:

* rectangular image annotations;
* annotation type selection;
* colored annotation styles;
* type filtering;
* source filtering;
* dynamic forms per annotation;
* read-only annotation viewing;
* selection cleanup before navigation to avoid Annotorious overlay errors;
* stable annotation rendering after navigation and reload.

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

Dynamic forms also support read-only mode for role-restricted scenarios.

### Localization

The UI supports English and Russian through bundled i18n JSON resources.

Localized areas include:

* app header and navigation;
* login page;
* dashboard;
* inspections list;
* inspection detail page;
* photo annotator entry page;
* photo annotator workspace;
* common dynamic form labels;
* settings page.

Localization works offline because translation resources are bundled into the PWA.

### ZIP export/import

AuditM-Field can export a full inspection package:

```text
manifest.json
config.json
inspections/
photos/
annotations/
rendered/
crops/
```

The ZIP can be imported back into the app. Original photos remain clean; rendered overlays and crops are generated as visual evidence for review and external processing.

### Storage adapters

Supported delivery options:

* local browser download;
* HTTP upload;
* Webhook upload;
* mock upload server for local testing.

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

Users with review permissions can:

* review pending AI suggestions;
* accept AI suggestions as human-reviewed annotations;
* reject AI suggestions;
* clear pending suggestions;
* inspect AI metadata.

Read-only roles can view AI suggestions but cannot accept or reject them.

---

## Tech stack

| Area         | Technology               |
| ------------ | ------------------------ |
| Frontend     | React                    |
| Language     | TypeScript               |
| Build        | Vite                     |
| PWA          | vite-plugin-pwa          |
| Styling      | Tailwind CSS             |
| Local DB     | Dexie / IndexedDB        |
| Annotation   | Annotorious              |
| Forms        | React Hook Form          |
| Validation   | Zod                      |
| Localization | i18next / react-i18next  |
| Export       | JSZip                    |
| Icons        | lucide-react             |
| Tests        | Vitest / Testing Library |

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

## Mock authorization

Current MVP uses local mock users for role-based demo scenarios.

The mock users are defined in:

```text
src/features/auth/mockUsers.ts
```

The permission model is defined in:

```text
src/features/auth/permissions.ts
```

Protected route wrappers:

```text
src/features/auth/RequireAuth.tsx
src/features/auth/RequirePermission.tsx
src/features/auth/RoleGate.tsx
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
1. Open the app.
2. Sign in as a role.
3. Load Retail Shelf Audit demo config.
4. Create inspection.
5. Import a photo.
6. Fill inspection/photo checklists.
7. Open Annotator.
8. Draw annotations as supervisor/admin.
9. View supervisor markup as merchandiser in read-only mode.
10. Fill annotation form where allowed.
11. Export ZIP.
12. Import ZIP back.
13. Test HTTP upload with mock server.
14. Generate and review AI suggestions.
```

---

## Documentation

| Document                        | Purpose                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `ROADMAP.md`                    | MVP roadmap and status                                       |
| `ARCHITECTURE.md`               | Architecture overview                                        |
| `docs/demo-flow.md`             | Step-by-step demo script                                     |
| `docs/role-based-review.md`     | Mock authorization, roles, permissions and review workflow   |
| `docs/configuration.md`         | Audit config format                                          |
| `docs/config-registry.md`       | GitHub config registry                                       |
| `docs/photo-annotator.md`       | Photo annotator behavior, read-only mode and stability notes |
| `docs/localization.md`          | RU/EN localization layer                                     |
| `docs/export-format.md`         | ZIP export/import structure                                  |
| `docs/transport-contract.md`    | HTTP/Webhook/n8n contract                                    |
| `docs/mock-upload-server.md`    | Local mock server usage                                      |
| `docs/n8n-workflow-example.md`  | n8n workflow example                                         |
| `docs/ai-suggestions-import.md` | AI suggestions import/review                                 |
| `docs/screenshots.md`           | Suggested screenshots for README/portfolio                   |
| `docs/release-notes/`           | Human-readable milestone release notes                       |

---

## Project status

Current status:

```text
MVP-12.2 complete locally:
Role-based review workflow, read-only annotation mode, RU/EN localization updates,
and stable Annotorious selection cleanup before navigation.
```

Next recommended stage:

```text
MVP-13:
Open-source readiness / docs polish / screenshots / release automation preparation.
```

---

## Repository structure

```text
src/
  app/
  core/
  entities/
  features/
    auth/
    fill-dynamic-form/
    language-switcher/
    import-ai-suggestions/
  pages/
    login/
    dashboard/
    inspections-list/
    inspection-detail/
    photo-annotator/
  services/
  shared/
    i18n/
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

* a standalone local-first PWA;
* a demo/portfolio project;
* a frontend layer for corporate audit systems;
* a data collection tool for AI/CV/OCR workflows;
* a prototype base for external backend integrations;
* a role-based visual review MVP for supervisor/field worker workflows.
