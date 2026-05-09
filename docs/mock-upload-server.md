# Mock upload server

AuditM-Field includes a small local mock server for testing HTTP upload / Webhook transport without a real backend.

## Start

```bash
npm run mock:upload
```

Default endpoint:

```text
http://localhost:8787/upload
```

## AuditM-Field settings

Open:

```text
Export Center -> Storage adapter
```

Use:

```text
Adapter: HTTP upload
HTTP upload URL: http://localhost:8787/upload
```

Then:

```text
Save adapter settings
Test adapter
Upload via HTTP upload
```

## Expected response

The mock server returns:

```json
{
  "accepted": true,
  "jobId": "mock-job-...",
  "message": "Mock server accepted package, received ... bytes",
  "externalUrl": "http://localhost:8787/jobs/mock-job-...",
  "status": "PROCESSING"
}
```

In Export jobs you should see:

```text
Success
HTTP upload
transport: PROCESSING
external job: mock-job-...
Open external job
```

## Custom port

```bash
PORT=8888 npm run mock:upload
```

