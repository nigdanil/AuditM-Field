# Audit Configuration

AuditM-Field is config-first. Audit behavior is defined by JSON config.

---

## Minimal config

```json
{
  "id": "retail-shelf-audit",
  "name": "Retail Shelf Audit",
  "version": "1.0.0",
  "photoTypes": [
    {
      "id": "overview",
      "label": "Overview"
    }
  ],
  "annotationTypes": [
    {
      "id": "product_area",
      "label": "Product area",
      "shape": "rectangle",
      "color": "#38bdf8"
    }
  ],
  "dictionaries": {
    "condition": ["OK", "Attention", "Critical"]
  },
  "inspectionForm": [],
  "photoForm": [],
  "annotationForm": []
}
```

---

## Top-level fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Config id |
| `name` | string | yes | Human-readable name |
| `version` | string | yes | Config version |
| `photoTypes` | array | yes | Available photo types |
| `annotationTypes` | array | yes | Available annotation types |
| `dictionaries` | object | no | Named value lists |
| `inspectionForm` | array | no | Inspection-level fields |
| `photoForm` | array | no | Photo-level fields |
| `annotationForm` | array | no | Annotation-level fields |

---

## Photo types

```json
{
  "id": "overview",
  "label": "Overview"
}
```

---

## Annotation types

```json
{
  "id": "product_area",
  "label": "Product area",
  "shape": "rectangle",
  "color": "#38bdf8",
  "description": "Product display area"
}
```

Supported shape values:

```text
rectangle
point
polygon
```

Current MVP primarily uses rectangle annotations.

---

## Dictionaries

```json
{
  "brands": ["Our brand", "Competitor 1", "Competitor 2"],
  "condition": ["OK", "Attention", "Critical"]
}
```

Dictionaries can be referenced by dynamic fields.

---

## Dynamic fields

Example:

```json
{
  "id": "brand",
  "type": "select",
  "label": "Brand",
  "required": true,
  "dictionary": "brands"
}
```

Supported field types:

```text
text
textarea
number
select
multiselect
boolean
radio
date
```

---

## Annotation form example

```json
"annotationForm": [
  {
    "id": "brand",
    "type": "select",
    "label": "Brand",
    "required": true,
    "dictionary": "brands"
  },
  {
    "id": "condition",
    "type": "select",
    "label": "Condition",
    "required": true,
    "dictionary": "condition"
  },
  {
    "id": "comment",
    "type": "textarea",
    "label": "Comment",
    "required": false
  }
]
```

---

## Inspection form example

```json
"inspectionForm": [
  {
    "id": "storeName",
    "type": "text",
    "label": "Store name",
    "required": true
  },
  {
    "id": "visitComment",
    "type": "textarea",
    "label": "Visit comment",
    "required": false
  }
]
```

---

## Photo form example

```json
"photoForm": [
  {
    "id": "photoComment",
    "type": "textarea",
    "label": "Photo comment",
    "required": false
  }
]
```

---

## Config design rules

Recommended:

```text
- keep ids stable;
- use lowercase snake_case or kebab-case ids;
- keep labels human-readable;
- use dictionaries for repeated values;
- avoid customer-specific secrets in public configs;
- version configs when fields change.
```

Avoid:

```text
- changing ids after production usage;
- hardcoding business logic in app code;
- storing working audit data in config files.
```
