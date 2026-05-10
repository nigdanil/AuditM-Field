# Export Format

AuditM-Field exports inspections as self-contained ZIP packages.

---

## ZIP structure

```text
manifest.json
config.json
inspections/
  inspection_<inspectionId>.json
photos/
  photos.metadata.json
  <photoId>_<fileName>
annotations/
  annotations.json
  <photoId>.annotations.json
rendered/
  <photoId>.overlay.png
  visual-evidence.warnings.json
crops/
  <photoId>/
    <annotationId>.png
```

---

## Source of truth

Original photos are exported without drawn boxes.

This is intentional.

```text
Original photo
+
annotations.json
+
overlay previews
+
annotation crops
```

Original photos remain clean for OCR, CV, LLM and repeated processing.

Overlay images are only visual evidence for humans and reports.

Crops are useful for AI pipelines because they isolate each annotated area.

---

## manifest.json

The manifest describes the exported package.

Example:

```json
{
  "app": {
    "name": "AuditM-Field",
    "packageFormatVersion": "1.1.0",
    "exportedAt": "2026-05-10T10:00:00.000Z"
  },
  "inspection": {
    "id": "inspection-id",
    "title": "Demo audit",
    "status": "EXPORTED",
    "configId": "retail-shelf-audit",
    "configName": "Retail Shelf Audit"
  },
  "config": {
    "included": true,
    "id": "retail-shelf-audit",
    "name": "Retail Shelf Audit",
    "version": "1.0.0"
  },
  "counts": {
    "photos": 1,
    "annotations": 2,
    "renderedOverlays": 1,
    "annotationCrops": 2
  },
  "files": {
    "manifest": "manifest.json",
    "config": "config.json",
    "inspection": "inspections/inspection_<id>.json",
    "photosMetadata": "photos/photos.metadata.json",
    "annotations": "annotations/annotations.json",
    "photos": [],
    "annotationsByPhoto": [],
    "renderedOverlays": [],
    "annotationCrops": []
  }
}
```

---

## config.json

The active audit config used for the inspection.

This makes exported packages self-describing.

---

## inspections/inspection_<id>.json

Contains the inspection record:

```text
id
configId
configName
title
locationName
address
status
attributes
comment
createdAt
updatedAt
```

---

## photos/photos.metadata.json

Contains metadata for imported photos:

```text
id
inspectionId
type
fileName
mimeType
size
width
height
attributes
createdAt
```

Photo binary files are stored separately in the `photos/` folder.

Original photo files are not modified and do not contain rendered annotation boxes.

---

## annotations/annotations.json

Contains image annotations:

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

---

## annotations/<photoId>.annotations.json

Contains annotations grouped by photo.

This is useful for backend/n8n/AI workflows where a single photo and its annotations are processed together.

---

## rendered/<photoId>.overlay.png

Human-readable visual preview.

The overlay image contains:

```text
original photo
+ annotation boxes
+ annotation label
+ annotation source
```

Use this for:

```text
manual review
reports
emails
n8n previews
portfolio screenshots
visual evidence
```

Do not use this as the only input for OCR/CV/LLM processing.

---

## crops/<photoId>/<annotationId>.png

Cropped image regions generated from annotation geometry.

Use this for:

```text
AI verification
OCR on selected area
classification
brand/condition checks
focused LLM vision prompts
```

---

## rendered/visual-evidence.warnings.json

Optional file.

Created only when some annotations could not be rendered as overlay/crop because geometry could not be resolved.

Example:

```json
{
  "warnings": [
    {
      "id": "annotation-id",
      "photoId": "photo-id",
      "reason": "Annotation geometry could not be resolved."
    }
  ]
}
```

---

## Import behavior

ZIP import is idempotent:

```text
inspection -> put
photos -> bulkPut
annotations -> bulkPut
```

Re-importing the same ZIP updates existing records by id.

Visual evidence files are ignored during import because they can be generated again from original photos and annotations.

---

## Compatibility

Current package format version:

```text
1.1.0
```

Version `1.0.0` packages remain compatible because import only requires:

```text
manifest.json
config.json
inspections/
photos/
annotations/
```

