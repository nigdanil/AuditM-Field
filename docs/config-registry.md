# Config Registry

AuditM-Field can load audit configs from a public GitHub registry.

## Registry index

Current registry index:

```text
https://raw.githubusercontent.com/nigdanil/AuditM-Field/main/public/config-registry/index.json
````

Repository path:

```text
public/config-registry/index.json
```

## Index format

```json
{
  "name": "AuditM-Field Config Registry",
  "description": "Public demo audit configurations for AuditM-Field.",
  "version": "1.0.0",
  "configs": [
    {
      "id": "retail-shelf-audit",
      "name": "Retail Shelf Audit",
      "version": "1.0.0",
      "description": "Demo configuration for retail shelf audits.",
      "domain": "retail",
      "configUrl": "https://raw.githubusercontent.com/nigdanil/AuditM-Field/main/public/demo-configs/retail-shelf-audit.config.json"
    }
  ]
}
```

## Config Manager flow

```text
Config Manager
  -> fetch GitHub registry index
  -> show available configs
  -> load selected configUrl
  -> validate with Zod
  -> save as active config
```

## Why raw GitHub URL

The public PWA can be deployed to GitHub Pages, while configs can still be loaded from the repository through raw GitHub URLs.

This keeps audit configs versioned in Git and available to the frontend without a backend.

## Adding new config

1. Add config file:

```text
public/demo-configs/my-audit.config.json
```

2. Add entry to:

```text
public/config-registry/index.json
```

3. Use raw GitHub URL:

```text
https://raw.githubusercontent.com/nigdanil/AuditM-Field/main/public/demo-configs/my-audit.config.json
```

4. Open Config Manager and click Refresh.
