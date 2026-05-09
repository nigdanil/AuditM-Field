# n8n workflow example for AuditM-Field

This document describes how to receive AuditM-Field ZIP packages in n8n.

Recommended flow:

```text
AuditM-Field PWA
  -> Export Center
  -> Webhook / HTTP upload adapter
  -> n8n Webhook node
  -> normalize metadata
  -> store ZIP / start processing
  -> respond with transport result
```

## Files

Example workflow:

```text
public/demo-transport/auditm-field-n8n-workflow.example.json
```

Example response:

```text
public/demo-transport/n8n-webhook-response.example.json
```

Transport contract:

```text
docs/transport-contract.md
```

## 1. Import workflow into n8n

In n8n:

```text
Workflows
  -> Import from file
  -> public/demo-transport/auditm-field-n8n-workflow.example.json
```

The workflow contains:

```text
Webhook node
  -> Normalize transport metadata
  -> Respond to AuditM-Field
```

## 2. Webhook URL

After importing and activating the workflow, n8n gives you a webhook URL.

For local n8n it may look like:

```text
http://localhost:5678/webhook/auditm-field-package
```

For production n8n it may look like:

```text
https://n8n.example.com/webhook/auditm-field-package
```

## 3. Configure AuditM-Field

Open:

```text
AuditM-Field
  -> Export Center
  -> Storage adapter
```

Set:

```text
Adapter: Webhook
Webhook URL: <your n8n webhook URL>
```

Then:

```text
Save adapter settings
Test adapter
Upload via Webhook
```

You can also use:

```text
Adapter: HTTP upload
HTTP upload URL: <your n8n webhook URL>
```

Both adapters send `multipart/form-data`.

## 4. Request contract

AuditM-Field sends:

| Field                  | Type        | Description                |
| ---------------------- | ----------- | -------------------------- |
| `file`                 | binary file | ZIP package                |
| `metadata`             | JSON file   | Full transport metadata    |
| `manifest`             | JSON file   | Export manifest            |
| `contractVersion`      | text        | Transport contract version |
| `packageFormatVersion` | text        | ZIP package format version |
| `inspectionId`         | text        | Inspection id              |
| `inspectionTitle`      | text        | Inspection title           |
| `configId`             | text        | Audit config id            |
| `configName`           | text        | Audit config name          |
| `adapterId`            | text        | `http-upload` or `webhook` |
| `fileName`             | text        | ZIP file name              |
| `fileSize`             | text        | ZIP file size in bytes     |
| `exportedAt`           | text        | Export timestamp           |

## 5. Expected response

n8n should return JSON:

```json
{
  "accepted": true,
  "jobId": "n8n-execution-123",
  "message": "AuditM-Field package accepted",
  "externalUrl": "https://n8n.example.com/execution/123",
  "status": "PROCESSING"
}
```

AuditM-Field will show:

```text
external job: n8n-execution-123
transport: PROCESSING
message
Open external job
```

## 6. What to add after the response

The example workflow only accepts the package and responds.

A real workflow can continue with:

```text
Store ZIP
  -> S3 / Google Drive / local disk / backend

Extract ZIP
  -> manifest.json
  -> config.json
  -> photos
  -> annotations

Process
  -> OCR
  -> Computer Vision
  -> LLM
  -> RAG

Return later
  -> suggestions.json
  -> report.json
  -> external dashboard
```

## 7. Important architecture rule

Do not put OCR / LLM keys directly into AuditM-Field PWA.

Use:

```text
PWA -> n8n/backend -> AI providers
```

This keeps secrets on the backend side and keeps AuditM-Field frontend-first, offline-friendly and adapter-based.
