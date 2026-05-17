# AuditM-Field Architecture

AuditM-Field is a frontend-first, offline-first, config-driven PWA for field photo audits, image annotation, role-based review, localization and structured evidence export.

---

## Core idea

```text
Audit config
  -> Dynamic UI
  -> Local role-aware workflow
  -> Local inspection data
  -> ZIP export/import
  -> External transport
  -> Optional AI suggestions
  -> Human review
```

The application separates:

```text
Configuration data
from
Working audit data
from
Current user/session permissions
```

---

## High-level architecture

```text
AuditM-Field PWA
|
|-- App shell
|-- Mock auth / permission layer
|-- Config loader
|-- i18n layer
|-- Dynamic UI builder
|-- Inspection module
|-- Photo import module
|-- Annotation module
|-- Checklist module
|-- Local IndexedDB storage
|-- ZIP export/import
|-- Storage adapters
|-- AI suggestions import/review
```

---

## Configuration flow

```text
Config source
  -> JSON config
  -> Zod validation
  -> local cache
  -> dynamic forms
  -> annotation types
  -> photo types
```

Supported config sources:

```text
- bundled demo config
- local JSON file
- direct URL
- GitHub registry
- future backend provider
```

---

## Auth and permission flow

Current MVP uses local mock authorization.

```text
Login page
  -> authStore
  -> currentUser
  -> role
  -> permissions
  -> route guards
  -> role-aware UI
```

Main files:

```text
src/pages/login/LoginPage.tsx
src/features/auth/authStore.ts
src/features/auth/mockUsers.ts
src/features/auth/permissions.ts
src/features/auth/RequireAuth.tsx
src/features/auth/RequirePermission.tsx
src/features/auth/RoleGate.tsx
```

Current roles:

```text
merchandiser
supervisor
admin
viewer
```

The permission layer controls:

* route visibility;
* navigation visibility;
* checklist write access;
* annotation edit access;
* AI review actions;
* export/config/settings access.

This is intentionally frontend-only for MVP and demo usage. A production backend must validate permissions server-side.

---

## Localization flow

```text
i18next initialization
  -> bundled translation resources
  -> LanguageSwitcher
  -> useTranslation(namespace)
  -> localized UI
```

Main files:

```text
src/shared/i18n/index.ts
src/shared/i18n/i18next.d.ts
src/shared/i18n/locales/en/*.json
src/shared/i18n/locales/ru/*.json
src/features/language-switcher/LanguageSwitcher.tsx
```

Localization is offline-friendly because translations are bundled with the PWA.

---

## Data flow

```text
User signs in locally
  -> creates inspection
  -> imports photo
  -> creates or views annotations according to permission
  -> fills forms according to permission
  -> IndexedDB stores records
  -> export builds ZIP
  -> local download or upload adapter
```

---

## Main entities

### User

Represents the current mock user and role.

Fields include:

```text
id
name
login
password
role
```

### Inspection

Represents one audit/check.

Fields include:

```text
id
configId
configName
title
locationName
address
status
attributes
createdAt
updatedAt
```

### Photo

Represents one imported image.

Fields include:

```text
id
inspectionId
type
fileName
mimeType
size
width
height
blob
attributes
createdAt
```

### Annotation

Represents one image annotation.

Fields include:

```text
id
inspectionId
photoId
type
label
rawAnnotation
attributes
source
comment
createdAt
updatedAt
```

Annotation source:

```text
human
ai
imported
```

### Export job

Represents local download or external upload operation.

Fields include:

```text
id
inspectionId
adapterId
status
fileName
targetUrl
attempts
responseStatus
responseText
metadata
createdAt
updatedAt
```

---

## Local storage

The app uses IndexedDB through Dexie.

Stored data:

```text
configs
inspections
photos
annotations
exportJobs
settings
```

The browser is the main working storage for MVP.

---

## Annotation architecture

The Photo Annotator is built around Annotorious and React state.

Core responsibilities:

```text
photo blob -> objectUrl
annotations from IndexedDB
  -> normalize rawAnnotation target.source to current objectUrl
  -> render through Annotorious setAnnotations(...)
  -> sync selected annotation with React state
  -> edit geometry only when role allows it
  -> save dynamic form values
```

Important stability rules:

* Do not rely on unsupported `filter={...}` behavior in Annotorious.
* Keep filtering in React state.
* Render only the annotations that should be visible.
* Normalize annotation source to the current image `blob:` URL before rendering.
* Avoid re-saving geometry when only the temporary image source changed.
* Clear active Annotorious selection before navigation to avoid SVG overlay errors during unmount.
* Use read-only mode for users without annotation edit permission.

---

## Role-based annotation behavior

```text
supervisor/admin
  -> can create/edit/delete annotations
  -> can fill annotation form
  -> can accept/reject AI suggestions

merchandiser/viewer
  -> can view annotations
  -> can select annotation from list
  -> can inspect values
  -> cannot edit supervisor geometry
  -> cannot delete supervisor annotations
  -> cannot accept/reject AI suggestions
```

This supports the MVP scenario where the merchandiser sees supervisor markup but does not change it.

---

## ZIP export architecture

```text
buildInspectionExportPackage()
  -> read inspection
  -> read photos
  -> read annotations
  -> build manifest
  -> include config
  -> include photo blobs
  -> generate ZIP
```

Package structure:

```text
manifest.json
config.json
inspections/
photos/
annotations/
rendered/
crops/
```

Original photos are exported without permanent drawn boxes. Rendered overlays and crops are generated as visual evidence.

---

## ZIP import architecture

```text
ZIP file
  -> read manifest.json
  -> read config.json
  -> read inspection JSON
  -> read photos metadata
  -> read photo blobs
  -> read annotations
  -> write to IndexedDB with put/bulkPut
```

Import is idempotent by record id.

---

## Storage adapters

Storage adapters isolate delivery logic from export logic.

Current adapters:

```text
LocalDownloadAdapter
HttpUploadAdapter
WebhookAdapter
```

Adapter interface:

```text
isConfigured(settings)
testConnection(settings)
uploadPackage(input)
```

Transport request:

```text
multipart/form-data
file
metadata
manifest
contractVersion
packageFormatVersion
inspectionId
configId
```

---

## n8n/backend integration

Recommended flow:

```text
AuditM-Field
  -> ZIP package
  -> Webhook / HTTP upload
  -> n8n/backend
  -> storage / OCR / CV / LLM / RAG
  -> response with external job id
```

AuditM-Field does not store backend secrets or AI provider keys.

---

## AI suggestions architecture

AuditM-Field does not call AI directly.

AI suggestions are imported as JSON:

```text
ai-suggestions.json
  -> validation
  -> photo/inspection id checks
  -> duplicate check
  -> save as annotations with source: ai
  -> human review in Annotator
```

Review actions:

```text
Accept
  -> source: human
  -> _aiReviewStatus: accepted
  -> _aiOriginalSource: ai

Reject
  -> delete annotation

Clear pending
  -> delete pending source: ai suggestions for current photo
```

Role restrictions apply: read-only roles can view AI metadata but cannot approve or reject AI suggestions.

---

## Module structure

```text
src/
  app/                 routes and application providers
  core/                config schema, config storage, config loading
  entities/            domain models and schemas
  features/            isolated user-facing feature blocks
  pages/               route-level pages
  services/            database, export, import, storage adapters
  shared/              i18n and common utilities
  widgets/             layout and reusable UI sections
```

---

## Design principles

### Config-first

Business behavior should be defined in JSON config, not hardcoded in React components.

### Frontend-first

The app should remain useful without a backend.

### Offline-first

Local work should continue without network access.

### Role-aware, not backend-auth-first

The MVP includes a frontend role model for demos. Production authorization must still be enforced by a backend.

### Adapter-based

External integrations should be implemented through adapters.

### AI-ready, not AI-first

AI must be optional. Human-entered and AI-generated data should remain distinguishable.

### Idempotent import

Package import should update existing records by id rather than failing on duplicates.

---

## Boundaries

AuditM-Field is not:

```text
- CRM
- task management system
- CVAT replacement
- Label Studio replacement
- backend platform
- AI provider
- production identity provider
```

AuditM-Field is:

```text
- field audit PWA
- photo evidence collector
- image annotation frontend
- dynamic checklist engine
- role-aware review UI
- structured export/import tool
- AI suggestion review UI
```
