# MVP-12.2 — Role-based review workflow

## Status

```text
Complete locally
Ready to commit and push
```

---

## Summary

MVP-12.2 adds a realistic role-based review scenario to AuditM-Field.

The main workflow now supports:

```text
Merchandiser
  -> creates/opens inspection
  -> uploads photo evidence
  -> views supervisor markup in read-only mode

Supervisor
  -> reviews photos
  -> creates markup
  -> fills annotation forms
  -> marks issues
  -> reviews AI suggestions
```

---

## Added

* Local mock login page.
* Mock users for role demo.
* Auth store.
* Protected routes.
* Permission-based route access.
* Role-aware navigation.
* Role-aware dashboard workflow blocks.
* Role labels in RU/EN.
* Read-only mode for dynamic forms.
* Read-only mode for annotation workspace.
* Permission-aware annotation actions.
* Permission-aware AI review actions.
* RU/EN translation updates for login, dashboard, inspections and annotator.
* Documentation for role-based review workflow.

---

## Fixed

* Annotorious SVG errors when navigating away with an active selected annotation.
* Unsupported Annotorious filter warning by avoiding direct unsupported filter behavior.
* Annotation selection instability after navigation/reload.
* Re-saving unchanged annotation geometry.
* Hardcoded UI text in key role workflow screens.

---

## User-visible result

* Merchandiser can see supervisor markup but cannot edit it.
* Supervisor can create/edit/delete annotations.
* Dashboard explains the current role workflow.
* Header shows the current user and role.
* Navigation only shows sections available for the current role.
* Leaving the annotator with an active selection does not produce console errors.
* RU/EN switching covers the new role workflow UI.

---

## Important technical notes

This is still frontend/local mock authorization.

For production usage, backend/server-side permission validation is required.

Recommended future work:

* backend user profile;
* server-side permission checks;
* audit event journal;
* review statuses;
* correction workflow;
* before/after photo pairing;
* supervisor comment model.
