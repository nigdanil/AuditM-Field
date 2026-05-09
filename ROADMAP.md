# AuditM-Field Roadmap

This roadmap describes the MVP stages for AuditM-Field.

---

## Status summary

| MVP | Name | Status |
| ---: | --- | --- |
| MVP-0 | App skeleton | Done |
| MVP-1 | Config loading | Done |
| MVP-2 | Inspections and local storage | Done |
| MVP-3 | Photo import | Done |
| MVP-4 | Image annotation | Done |
| MVP-4.1 | Annotation styling and filtering | Done |
| MVP-5 | Dynamic annotation form | Done |
| MVP-6 | Inspection and photo checklists | Done |
| MVP-7 | ZIP export | Done |
| MVP-7.1 | Export polish | Done |
| MVP-8 | Import package back | Done |
| MVP-9 | Storage adapters | Done |
| MVP-9.1 | Storage adapters polish | Done |
| MVP-9.2 | Annotator entry polish | Done |
| MVP-10 | Transport workflow / n8n-ready integration | Done |
| MVP-10.2 | n8n workflow example | Done |
| MVP-11 | AI suggestions import | Done |
| MVP-11.1 | AI suggestions mock generator | Done |
| MVP-11.2 | AI suggestions review | Done |
| MVP-11.3 | AI suggestions polish | Done |
| MVP-12 | Open-source readiness / docs polish | Current |

---

## MVP-0: App skeleton

Goal: create the base PWA application.

Result:

```text
React + TypeScript + Vite app with layout, routing and PWA foundation.
```

---

## MVP-1: Config loading

Goal: make the app configurable through JSON audit configs.

Result:

```text
The app can load, validate and cache audit configs.
```

---

## MVP-2: Inspections and local storage

Goal: create and store inspections locally.

Result:

```text
Inspections are stored in IndexedDB and can be opened later.
```

---

## MVP-3: Photo import

Goal: import photos from gallery.

Result:

```text
Photos are saved locally with metadata and preview support.
```

---

## MVP-4: Image annotation

Goal: annotate photos.

Result:

```text
Users can create, update and delete image annotations.
```

---

## MVP-4.1: Annotation styling and filtering

Goal: improve visual annotation experience.

Result:

```text
Annotation colors and type filters are controlled by config.
```

---

## MVP-5: Dynamic annotation form

Goal: add dynamic forms for annotation attributes.

Result:

```text
Selecting an annotation opens a config-driven form.
```

---

## MVP-6: Inspection and photo checklists

Goal: add checklist forms at inspection and photo level.

Result:

```text
Inspection and photo attributes are stored and validated.
```

---

## MVP-7: ZIP export

Goal: export full inspection package.

Result:

```text
The app can generate a ZIP with manifest, config, photos and annotations.
```

---

## MVP-7.1: Export polish

Goal: improve export UX.

Result:

```text
Export preview, counts, safe status handling and better ZIP naming.
```

---

## MVP-8: Import package back

Goal: restore exported package.

Result:

```text
ZIP packages can be imported back into IndexedDB.
```

---

## MVP-9: Storage adapters

Goal: send ZIP packages outside the browser.

Result:

```text
Local download, HTTP upload and Webhook adapters.
```

---

## MVP-9.1: Storage adapters polish

Goal: improve adapter reliability and UX.

Result:

```text
Test adapter, retry jobs, confirmations, response display and settings polish.
```

---

## MVP-9.2: Annotator entry polish

Goal: replace empty Annotator route with useful photo picker.

Result:

```text
Annotator page lists recent photos grouped by inspection.
```

---

## MVP-10: Transport workflow / n8n-ready integration

Goal: define upload contract for backend/n8n.

Result:

```text
HTTP/Webhook transport sends file, metadata, manifest and contract fields.
```

---

## MVP-10.2: n8n workflow example

Goal: provide importable n8n workflow example.

Result:

```text
Demo n8n workflow can receive AuditM-Field packages.
```

---

## MVP-11: AI suggestions import

Goal: import AI-generated annotation suggestions.

Result:

```text
AI suggestions JSON can be validated and imported as source: ai annotations.
```

---

## MVP-11.1: AI suggestions mock generator

Goal: make local AI import test simple.

Result:

```text
The app can generate demo AI suggestions using real local inspection/photo ids.
```

---

## MVP-11.2: AI suggestions review

Goal: allow human review of AI suggestions.

Result:

```text
Users can accept or reject imported AI annotations.
```

---

## MVP-11.3: AI suggestions polish

Goal: improve AI review UX.

Result:

```text
Pending AI filter, clear pending suggestions, metadata details and duplicate protection.
```

---

## MVP-12: Open-source readiness / docs polish

Goal: prepare project for GitHub, portfolio and public demo.

Scope:

```text
README
ROADMAP
ARCHITECTURE
CONTRIBUTING
demo flow
screenshots guide
configuration docs
export format docs
```

---

## Future ideas

### MVP-13: Demo publishing

```text
- GitHub Pages / Vercel deployment
- demo dataset
- demo screenshots
- public demo URL
```

### MVP-14: Test coverage

```text
- unit tests for config validation
- unit tests for export/import
- unit tests for AI suggestions import
- smoke tests for main pages
```

### MVP-15: UX polish

```text
- mobile-first layout polish
- local storage size indicator
- better empty states
- onboarding screen
- help page
```

### MVP-16: Backend connector examples

```text
- simple Node.js upload endpoint
- n8n processing workflow
- S3/Google Drive storage examples
```

### MVP-17: AI suggestions round-trip

```text
- backend-generated suggestions package
- report import
- suggestion comparison
- confidence thresholds
```
