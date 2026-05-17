# AuditM-Field Demo Flow

This document describes a recommended demo scenario for presenting AuditM-Field.

---

## Goal

Show the full local-first workflow:

```text
Role login
  -> Config
  -> Inspection
  -> Photo
  -> Annotation
  -> Supervisor review
  -> Merchandiser read-only markup view
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

## 2. Sign in

Open the app and sign in with one of the local mock users.

Recommended demo order:

```text
1. Admin or supervisor: prepare/review data.
2. Merchandiser: show read-only supervisor markup.
```

Mock users are defined in:

```text
src/features/auth/mockUsers.ts
```

---

## 3. Load demo config

Open:

```text
Config Manager
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

## 4. Create inspection

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

## 5. Fill inspection checklist

In the inspection detail page, fill the inspection-level checklist.

Example:

```text
Store name: Demo store
Address: Demo address
Visit comment: Initial visit
```

Save the inspection checklist.

---

## 6. Import photo

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

## 7. Fill photo checklist

Fill the photo-level checklist if configured.

Example:

```text
Photo comment: Shelf overview
```

Save the photo checklist.

---

## 8. Open Annotator as supervisor

Click:

```text
Annotate
```

Expected result:

```text
Photo Annotator opens with the selected photo.
```

---

## 9. Create supervisor annotations

Select annotation type:

```text
Product area
Price tag
Violation
Competitor zone
```

Draw rectangles on the image.

Expected result:

```text
Annotations appear in the list.
Dynamic form becomes available.
```

---

## 10. Fill annotation form

Example:

```text
Brand: Our brand
Condition: OK
Violation type: Wrong placement
Comment: Demo supervisor markup
```

Save the form.

---

## 11. Check navigation stability

With an annotation selected, click:

```text
Back to inspection
```

Expected result:

```text
The app navigates back without console errors.
The annotation remains saved.
```

This demonstrates the Annotorious selection cleanup before navigation.

---

## 12. Re-login as merchandiser

Log out and sign in as merchandiser.

Open the same inspection and photo.

Expected result:

```text
Merchandiser can see supervisor markup.
Merchandiser can select annotations and inspect values.
Merchandiser cannot edit geometry, form values, delete annotations or review AI suggestions.
```

---

## 13. Export ZIP

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

## 14. Import ZIP back

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

## 15. Test mock HTTP upload

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

## 16. Generate and review AI suggestions

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

Actions for supervisor/admin:

```text
Accept -> source becomes human
Reject -> suggestion is deleted
Clear pending AI suggestions -> pending suggestions are removed
```

Read-only roles can inspect AI metadata but cannot approve/reject suggestions.

---

## 17. Demo talking points

Use these points when presenting:

```text
- Business logic is config-driven.
- The app works without backend.
- Data is stored locally.
- Roles demonstrate field capture and supervisor review.
- Merchandiser can view supervisor markup without editing it.
- Export ZIP makes data portable.
- Upload adapters connect to backend/n8n.
- AI is optional and reviewed by humans.
- The PWA does not store AI provider secrets.
- RU/EN localization is bundled and works offline.
```
