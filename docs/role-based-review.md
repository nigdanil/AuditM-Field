# Role-based review workflow

AuditM-Field includes a local role-based review scenario for demonstrating field work and supervisor review.

This is an MVP frontend authorization layer. It is useful for demos, UX validation and future backend integration design.

---

## Goal

Support a realistic workflow:

```text
Merchandiser captures photo evidence
  -> Supervisor reviews photos and adds markup
  -> Merchandiser sees supervisor markup and comments
  -> Merchandiser uploads corrected evidence
  -> Supervisor accepts or requests further correction
```

---

## Current roles

| Role           | Purpose                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------- |
| `merchandiser` | Field user who creates inspections, uploads photos and views supervisor markup.             |
| `supervisor`   | Reviewer who checks photos, creates markup, captures violations and approves/corrects work. |
| `admin`        | Demo/config/export manager with broad access.                                               |
| `viewer`       | Read-only role for inspection/evidence viewing.                                             |

---

## Current implementation files

```text
src/pages/login/LoginPage.tsx
src/features/auth/authStore.ts
src/features/auth/mockUsers.ts
src/features/auth/permissions.ts
src/features/auth/RequireAuth.tsx
src/features/auth/RequirePermission.tsx
src/features/auth/RoleGate.tsx
src/widgets/app-header/AppHeader.tsx
src/pages/dashboard/DashboardPage.tsx
src/pages/inspection-detail/InspectionDetailPage.tsx
src/pages/photo-annotator/PhotoAnnotatorPage.tsx
```

---

## Permission-controlled areas

| Area                 | Permission examples                                                              |
| -------------------- | -------------------------------------------------------------------------------- |
| Config Manager       | `config:manage`                                                                  |
| Inspections          | `inspection:view`, `inspection:create`, `inspection:update`                      |
| Photo import         | `photo:import`, `photo:delete`                                                   |
| Annotation workspace | `annotation:view`, `annotation:create`, `annotation:update`, `annotation:delete` |
| AI review            | `annotation:review`                                                              |
| Export Center        | `export:create`                                                                  |
| Settings             | `settings:manage`                                                                |

Exact permissions are defined in:

```text
src/features/auth/permissions.ts
```

---

## Merchandiser behavior

The merchandiser scenario is intentionally limited.

Expected behavior:

* can access inspections;
* can create and open inspections if permission allows it;
* can upload field photos if permission allows it;
* can open the annotator in view mode;
* can select supervisor annotations;
* can inspect annotation form values;
* cannot change supervisor annotation geometry;
* cannot delete supervisor annotations;
* cannot accept/reject AI suggestions;
* cannot edit read-only dynamic forms.

This enables the important MVP use case:

```text
"I see what the supervisor marked, but I cannot change the supervisor's markup."
```

---

## Supervisor behavior

Expected behavior:

* can open inspections;
* can review uploaded photos;
* can create annotations;
* can edit annotation geometry;
* can fill annotation-level dynamic forms;
* can mark violations;
* can delete annotations;
* can accept/reject AI suggestions;
* can use source/type filters.

---

## Admin behavior

Expected behavior:

* can access config management;
* can open all main screens;
* can test role workflows;
* can export evidence packages;
* can manage settings.

---

## Read-only form behavior

Dynamic forms support read-only mode.

Used for:

* inspection detail fields when status or role does not allow editing;
* photo-level checklist fields when role does not allow editing;
* annotation-level form fields when annotation edit permission is missing.

Read-only mode should:

* show existing values;
* disable inputs;
* hide or disable save actions;
* show a clear read-only explanation.

---

## Annotator navigation stability

When a user leaves the annotator with an active selected annotation, Annotorious can keep edit handles during component unmount.

The current solution clears active selection before navigation intent:

```text
pointerdown/click on navigation target
  -> clear selected annotation in React state
  -> call Annotorious cancel/setSelected cleanup
  -> navigate away safely
```

This avoids SVG overlay errors such as:

```text
Expected length, "NaN"
Expected length, "Infinity"
Expected length, "-Infinity"
```

---

## MVP limitations

Current role model is frontend/local only.

It does not provide production security by itself.

Production version should add:

* backend user session;
* backend-issued permissions;
* server-side validation for writes;
* audit event journal;
* role mapping from SSO/Keycloak/backend groups;
* API-level ownership and scope checks.

---

## Future improvements

Recommended next steps:

* add explicit review status model;
* add "submitted to supervisor" status;
* add "correction requested" status;
* add "accepted" status;
* add before/after photo pairing;
* add supervisor comments per annotation;
* add task-like correction list;
* add audit event log;
* add backend permission contract;
* add tests for permission matrix.
