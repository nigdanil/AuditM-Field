# AuditM-Field Architecture

AuditM-Field is a frontend-first, offline-first, config-driven PWA for field photo audits and image annotation.

---

## Core idea

```text
Audit config
  -> Dynamic UI
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
```

---

## High-level architecture

```text
AuditM-Field PWA
  |
  |-- App shell
  |-- Config loader
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
- future GitHub registry / backend provider
```

---

## Data flow

```text
User creates inspection
  -> imports photo
  -> creates annotations
  -> fills forms
  -> IndexedDB stores records
  -> export builds ZIP
  -> local download or upload adapter
```

---

## Main entities

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
  inspection_<id>.json
photos/
  photos.metadata.json
  <photoId>_<fileName>
annotations/
  annotations.json
```

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

---

## Module structure

```text
src/
  app/
    routes and application providers

  core/
    config schema, config storage, config loading

  entities/
    domain models and schemas

  features/
    isolated user-facing feature blocks

  pages/
    route-level pages

  services/
    database, export, import, storage adapters

  widgets/
    layout and reusable UI sections
```

---

## Design principles

### Config-first

Business behavior should be defined in JSON config, not hardcoded in React components.

### Frontend-first

The app should remain useful without a backend.

### Offline-first

Local work should continue without network access.

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
```

AuditM-Field is:

```text
- field audit PWA
- photo evidence collector
- image annotation frontend
- dynamic checklist engine
- structured export/import tool
- AI suggestion review UI
```
