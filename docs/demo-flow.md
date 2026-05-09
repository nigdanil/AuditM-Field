# AuditM-Field Demo Flow

This document describes a recommended demo scenario for presenting AuditM-Field.

---

## Goal

Show the full local-first workflow:

```text
Config
  -> Inspection
  -> Photo
  -> Annotation
  -> Dynamic forms
  -> ZIP export/import
  -> Transport
  -> AI suggestions review
```

---

## 1. Start the app

```bash
npm install
npm run dev
```

Open the local Vite URL in a browser.

---

## 2. Load demo config

Open:

```text
Configs
```

Load or select:

```text
Retail Shelf Audit
```

Expected result:

```text
Active config: Retail Shelf Audit
```

---

## 3. Create inspection

Open:

```text
Inspections
```

Create a new inspection:

```text
Title: Demo retail audit
Location: Demo store
Address: Demo address
Comment: Demo inspection
```

Open the created inspection.

---

## 4. Fill inspection checklist

In the inspection detail page, fill the inspection-level checklist.

Example:

```text
Store name: Demo store
Address: Demo address
Visit comment: Initial visit
```

Save the inspection checklist.

---

## 5. Import photo

In the photo gallery:

```text
Photo type: Overview
Import photos
```

Select a demo image from local disk.

Expected result:

```text
Photo card appears in the gallery.
```

---

## 6. Fill photo checklist

Fill the photo-level checklist if configured.

Example:

```text
Photo comment: Shelf overview
```

Save the photo checklist.

---

## 7. Open Annotator

Click:

```text
Annotate
```

Expected result:

```text
Photo Annotator opens with the selected photo.
```

---

## 8. Create annotation

Select annotation type:

```text
Product area
```

Draw a rectangle on the image.

Expected result:

```text
Annotation appears in the list.
Dynamic form becomes available.
```

---

## 9. Fill annotation form

Example:

```text
Brand: Our brand
Condition: OK
Comment: Demo product area
```

Save the form.

---

## 10. Export ZIP

Open:

```text
Export
```

Click:

```text
Download ZIP
```

Expected result:

```text
ZIP file is downloaded.
Export job is created.
```

---

## 11. Import ZIP back

Open:

```text
Export -> Import package
```

Upload the exported ZIP.

Expected result:

```text
Package imported successfully.
Existing records are updated by id.
```

---

## 12. Test mock HTTP upload

Start mock server:

```bash
npm run mock:upload
```

In Export Center:

```text
Adapter: HTTP upload
HTTP upload URL: http://localhost:8787/upload
Save adapter settings
Test adapter
Upload via HTTP upload
```

Expected result:

```text
Export job success
external job: mock-job-...
transport: PROCESSING
```

---

## 13. Generate and review AI suggestions

Open:

```text
Export -> AI suggestions import
```

Click:

```text
Generate & import demo
```

Then:

```text
Open first affected photo
```

In Annotator:

```text
Source filter -> Pending AI
```

Expected result:

```text
AI suggestion appears with confidence and review status.
```

Actions:

```text
Accept -> source becomes human
Reject -> suggestion is deleted
Clear pending AI suggestions -> pending suggestions are removed
```

---

## 14. Demo talking points

Use these points when presenting:

```text
- Business logic is config-driven.
- The app works without backend.
- Data is stored locally.
- Export ZIP makes data portable.
- Upload adapters connect to backend/n8n.
- AI is optional and reviewed by humans.
- The PWA does not store AI provider secrets.
```
