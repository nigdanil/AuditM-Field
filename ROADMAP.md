# AuditM-Field Roadmap

This roadmap tracks MVP evolution of AuditM-Field as a configurable offline-first PWA for field photo audits, image annotation, structured evidence collection, ZIP transport, localization, role-based review and AI-assisted review.

---

## Current status

```text
Current local milestone: MVP-12.2
Status: complete locally, ready to be committed and pushed
```

MVP-12.2 includes:

* local mock authorization;
* route protection through `RequireAuth` and `RequirePermission`;
* role-aware navigation;
* role-aware dashboard workflow hints;
* merchandiser/supervisor/admin/viewer scenario foundation;
* read-only annotation mode for roles without edit permission;
* read-only dynamic forms;
* supervisor annotation editing/review flow;
* AI review action restrictions by permission;
* RU/EN translation updates for login, dashboard, inspections and annotator;
* stable Annotorious selection cleanup before navigation;
* preserved annotation rendering after reload and navigation.

---

## Completed milestones

| MVP      | Status | Result                                                            |
| -------- | ------ | ----------------------------------------------------------------- |
| MVP-1    | Done   | Basic React/Vite application shell                                |
| MVP-2    | Done   | Config-first audit model                                          |
| MVP-3    | Done   | Local inspections and photo import                                |
| MVP-4    | Done   | Photo annotation with Annotorious                                 |
| MVP-4.1  | Done   | Annotation colors, styles and type filtering                      |
| MVP-5    | Done   | Dynamic annotation form                                           |
| MVP-6    | Done   | IndexedDB persistence via Dexie                                   |
| MVP-7    | Done   | ZIP export/import structure                                       |
| MVP-8    | Done   | Export Center and storage adapter direction                       |
| MVP-9    | Done   | HTTP/Webhook/n8n transport direction                              |
| MVP-10   | Done   | Demo transport examples                                           |
| MVP-11   | Done   | AI suggestions import                                             |
| MVP-11.3 | Done   | Human review workflow for AI suggestions                          |
| MVP-12   | Done   | i18n foundation and RU/EN localization                            |
| MVP-12.1 | Done   | Stable annotation rendering and selection after navigation/reload |
| MVP-12.2 | Done   | Role-based review scenario and read-only annotation workflow      |

---

## MVP-12: Localization

### Goal

Prepare the app for real-world demos in English and Russian without hardcoding UI text into components.

### Implemented

* Added `i18next`.
* Added `react-i18next`.
* Added local translation resources.
* Added `LanguageSwitcher`.
* Added i18n initialization in `src/main.tsx`.
* Added gradual localization support through `LegacyUiLocalizer`.
* Localized:

  * app header;
  * login page;
  * dashboard;
  * inspections list;
  * inspection detail page;
  * photo annotator entry page;
  * photo annotator workspace;
  * settings page;
  * common dynamic form labels.

### Notes

The current localization approach is compatible with offline-first usage because translation JSON files are bundled with the app.

---

## MVP-12.1: Stable photo annotation workflow

### Goal

Make the photo annotator reliable after navigation, page reload and repeated annotation selection.

### Problems fixed

Before the fix, saved annotations could disappear visually after page transitions or require two clicks to select after page reload.

Root causes:

* Annotorious image source depends on temporary `blob:` URLs.
* After reload, the browser generates a new `blob:` URL for the same stored photo.
* Stored annotations could still contain old `target.source` values.
* Geometry was sometimes re-saved even when only the temporary image source changed.
* `setAnnotations(...)` could rebuild the annotation layer and reset selection state.

### Implemented

* Normalize annotation `target.source` to the current `objectUrl`.
* Restore annotations after page navigation.
* Restore annotations after page reload.
* Track rendered annotation IDs.
* Synchronize selected annotation between Annotorious and React state.
* Avoid IndexedDB writes when annotation geometry is unchanged.
* Keep selected annotation stable after click.
* Keep AI review and dynamic form workflows intact.

### User-visible result

* Saved annotations remain visible after page reload.
* Existing annotation can be selected with one click.
* Selected annotation is reflected in the right-side panel.
* Dynamic annotation form opens for the selected annotation.
* AI suggestions can still be accepted, rejected or cleared.

---

## MVP-12.2: Role-based review workflow

### Goal

Add a realistic field workflow foundation where a merchandiser and a supervisor see different UI behavior and permissions.

### Implemented

* Added login page for local mock authorization.
* Added auth store and mock users.
* Added route guards.
* Added permission checks for major routes.
* Added role-aware app header.
* Added role-aware dashboard workflow cards.
* Added read-only inspection and dynamic form behavior where editing is not allowed.
* Added read-only annotation workspace behavior.
* Allowed merchandiser to view supervisor markup without changing geometry, form data, AI review decisions or deletion.
* Allowed supervisor/admin to create, edit, delete and review annotations.
* Added cleanup of active Annotorious selection before navigation to avoid SVG `NaN` / `Infinity` overlay errors.
* Added RU/EN translations for the new role and review workflow.

### User-visible result

* Merchandiser has a dedicated workspace flow.
* Supervisor has a dedicated review flow.
* Navigation hides unavailable sections based on permissions.
* Photo annotator supports both edit and read-only modes.
* Leaving the annotator with a selected annotation does not produce console errors.
* The same PWA can now demonstrate both field capture and review use cases.

---

## Next milestones

## MVP-13: Open-source readiness

### Goal

Prepare the repository for public presentation, GitHub demo usage and management review.

### Planned

* Add/update screenshots.
* Add demo GIF or short screen recording.
* Add README screenshot block.
* Add concise product positioning block.
* Add troubleshooting section.
* Add contribution guidelines polish.
* Add issue templates.
* Add public demo data disclaimer.
* Add role-based demo script screenshots.
* Add mobile/responsive screenshots.

---

## MVP-14: Release automation

### Goal

Automate versioning, changelog and GitHub releases.

### Planned

* Adopt Conventional Commits.
* Add Release Please workflow.
* Generate changelog automatically.
* Create GitHub releases automatically.
* Use semantic versioning:

  * `fix:` -> patch;
  * `feat:` -> minor;
  * breaking changes -> major.

---

## MVP-15: Testing and quality

### Goal

Reduce regression risk for the annotation workflow, role permissions and offline data model.

### Planned

* Add unit tests for config schema.
* Add tests for permission matrix.
* Add tests for auth store.
* Add tests for annotation repository.
* Add tests for read-only dynamic form behavior.
* Add tests for export/import.
* Add tests for i18n initialization.
* Add smoke test for photo annotation page.
* Add regression test for annotation normalization.
* Add regression test for selection cleanup before navigation.

---

## MVP-16: Config registry improvements

### Goal

Make config loading easier for demo and real usage.

### Planned

* Improve GitHub config registry support.
* Add config metadata:

  * domain;
  * version;
  * language;
  * description;
  * screenshots;
  * sample data.
* Add config search.
* Add config validation report UI.
* Add config version compatibility checks.

---

## MVP-17: Backend / n8n integration

### Goal

Make AuditM-Field easier to connect to external systems.

### Planned

* Stabilize HTTP upload contract.
* Add backend upload example.
* Add n8n workflow example.
* Add webhook response example.
* Add import of processed AI suggestions from external workflow.
* Add error journal for failed uploads.
* Add external job status refresh.

---

## MVP-18: AI workflow

### Goal

Keep AI optional and adapter-based.

### Planned

* Keep OCR/CV/LLM/RAG outside the PWA.
* Use ZIP package as transport boundary.
* Import AI suggestions as reviewable annotations.
* Add confidence thresholds.
* Add batch accept/reject.
* Add AI metadata visualization.
* Add semantic matching / reconciliation scenarios.
* Add supervisor-specific AI review queue.

---

## MVP-19: Real backend authorization

### Goal

Replace local mock authorization with a real integration-ready auth boundary.

### Planned

* Backend-issued user profile.
* Backend-issued permission set.
* Optional SSO/Keycloak integration.
* Token refresh strategy.
* Role mapping from backend groups.
* Server-side validation for write operations.
* Audit event journal for role-sensitive actions.

---

## Long-term direction

AuditM-Field should become a reusable frontend core for:

* field audits;
* photo evidence collection;
* visual inspection;
* structured checklist workflows;
* role-based supervisor review;
* AI-assisted annotation review;
* offline-first data capture;
* backend/n8n integration demos.
