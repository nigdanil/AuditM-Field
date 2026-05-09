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
```

---

## manifest.json

The manifest describes the exported package.

Example:

```json
{
  "app": {
    "name": "AuditM-Field",
    "packageFormatVersion": "1.0.0",
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
    "annotations": 2
  },
  "files": {
    "manifest": "manifest.json",
    "config": "config.json",
    "inspection": "inspections/inspection_<id>.json",
    "photosMetadata": "photos/photos.metadata.json",
    "annotations": "annotations/annotations.json",
    "photos": []
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

## Import behavior

ZIP import is idempotent:

```text
inspection -> put
photos -> bulkPut
annotations -> bulkPut
```

Re-importing the same ZIP updates existing records by id.

---

## Compatibility

Current package format version:

```text
1.0.0
```

Future versions should preserve backward compatibility where possible.
