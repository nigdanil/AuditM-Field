# GitHub Pages deployment

AuditM-Field can be deployed as a static PWA to GitHub Pages.

Repository:

```text
https://github.com/nigdanil/AuditM-Field
```

Public URL:

```text
https://nigdanil.github.io/AuditM-Field/
```

## Vite base

Because this is a project page and not a root user page, Vite must use:

```ts
base: '/AuditM-Field/'
```

The PWA manifest also uses:

```ts
start_url: '/AuditM-Field/'
scope: '/AuditM-Field/'
```

## Workflow

Deployment workflow:

```text
.github/workflows/deploy-pages.yml
```

It runs on:

```text
push to main
manual workflow_dispatch
```

Build process:

```text
npm ci
npm run build
cp dist/index.html dist/404.html
upload dist as GitHub Pages artifact
deploy to GitHub Pages
```

## Repository settings

In GitHub:

```text
Settings
  -> Pages
  -> Build and deployment
  -> Source: GitHub Actions
```

After pushing to `main`, open:

```text
Actions
  -> Deploy GitHub Pages
```

When the workflow is green, open:

```text
https://nigdanil.github.io/AuditM-Field/
```

## PWA install

Android:

```text
Chrome / Edge
  -> open https://nigdanil.github.io/AuditM-Field/
  -> menu
  -> Install app / Add to Home screen
```

iOS:

```text
Safari
  -> open https://nigdanil.github.io/AuditM-Field/
  -> Share
  -> Add to Home Screen
```

## Notes

GitHub Pages is suitable for the frontend-only demo.

Local IndexedDB data is stored in the browser and is not shared between devices.

HTTP/Webhook upload adapters require external endpoints with CORS enabled.
