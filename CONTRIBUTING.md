# Contributing to AuditM-Field

Thank you for your interest in AuditM-Field.

This project is a configurable offline-first PWA for field photo audits, image annotation and structured export.

---

## Development setup

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Mock upload server:

```bash
npm run mock:upload
```

---

## Project principles

Please keep these principles in mind:

```text
Config-first
Frontend-first
Offline-first
Adapter-based
AI-ready, not AI-first
```

---

## Code style

Preferred approach:

```text
- TypeScript-first
- explicit types for domain entities
- Zod for runtime validation
- small services for business logic
- React pages for route-level orchestration
- reusable features/widgets where useful
```

Avoid:

```text
- hardcoding business-specific audit logic in UI components
- direct AI provider calls from the PWA
- storing secrets in frontend code
- adding backend-specific logic to core modules
```

---

## Data model changes

If you change entities, also update:

```text
entities/*/types.ts
entities/*/schemas.ts
services/db/db.ts
docs/export-format.md
ARCHITECTURE.md
```

---

## Config changes

If you change config format, also update:

```text
src/core/config/config.schema.ts
src/core/config/types.ts
docs/configuration.md
public/demo-configs/*
```

---

## Export/import changes

If you change package structure, also update:

```text
docs/export-format.md
docs/transport-contract.md
services/export/*
services/import/*
```

---

## AI workflow changes

AI must stay behind backend/n8n transport.

Recommended path:

```text
PWA
  -> export ZIP
  -> backend/n8n
  -> AI providers
  -> ai-suggestions.json
  -> PWA import
  -> human review
```

Do not add AI provider API keys to frontend code.

---

## Commit style

Suggested commit examples:

```text
feat(config): add dynamic audit schema
feat(export): build inspection ZIP package
feat(ai): review imported suggestions
docs(readme): add project overview
fix(annotator): preserve annotation geometry
```

---

## Pull request checklist

Before opening a PR:

```text
npm run build
npm run lint
```

Also check manually:

```text
- app opens
- config loads
- inspection can be created
- photo can be imported
- annotation can be created
- ZIP export works
- ZIP import works
```
