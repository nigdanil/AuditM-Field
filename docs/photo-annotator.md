# Photo Annotator

The Photo Annotator is the core visual evidence workspace in AuditM-Field.

It allows the user to draw rectangular annotations on imported photos, classify areas by type, fill dynamic forms and review AI-generated suggestions.

---

## Main capabilities

- Draw rectangular annotations.
- Select annotation type from active JSON config.
- Render annotation colors from config.
- Store annotations locally in IndexedDB.
- Display saved annotations after navigation and reload.
- Filter visible annotations by type.
- Filter annotations by source:
  - all;
  - human;
  - AI;
  - pending AI;
  - imported.
- Fill dynamic annotation-level forms.
- Display AI metadata.
- Accept/reject AI suggestions.

---

## Annotation sources

Annotations can have different sources:

| Source | Meaning |
| --- | --- |
| `human` | Created or accepted by a human user |
| `ai` | Imported as AI suggestion |
| `imported` | Imported from external package or transport flow |

Pending AI suggestions are identified by AI review metadata.

---

## AI review flow

```text
Import AI suggestions
  -> Show pending AI annotations
  -> User reviews visual area and metadata
  -> Accept
      -> source changes to human
      -> AI metadata is preserved
  -> Reject
      -> annotation is deleted
```

The PWA does not run AI models directly. AI/OCR/CV/LLM/RAG should run behind backend or n8n workflows.

---

## Stability fixes

### Problem

After navigation or page reload, saved annotations could be stored in IndexedDB but not rendered correctly on the image.

In some cases, after page reload the user had to click an annotation twice before it remained selected.

### Root cause

Browser image URLs are temporary:

```text
blob:...
```

After page reload, the same stored photo receives a new `blob:` URL.

If saved annotation payload contains the previous `target.source`, Annotorious can treat the annotation as connected to a different image source.

Also, when unchanged annotation geometry was re-saved, `useLiveQuery` reloaded annotations and `setAnnotations(...)` rebuilt the Annotorious layer. This could reset the current selection.

### Implemented solution

* Normalize saved annotation payload before rendering.
* Set annotation `id` explicitly during normalization.
* Normalize `target.source` to the current image `objectUrl`.
* Track rendered annotation IDs.
* Keep selected annotation ID in React state and ref.
* Listen to Annotorious selection changes.
* Avoid saving annotation geometry when normalized payload did not change.
* Include current `objectUrl` in geometry comparison.
* Restore one-click selection after page reload.

---

## Expected behavior

After the latest fix:

* annotations are visible after navigation;
* annotations are visible after page reload;
* existing annotation is selected with one click;
* selected annotation is highlighted on the image;
* selected annotation is highlighted in the right-side list;
* dynamic form opens for the selected annotation;
* geometry updates are saved only when actually changed.

---

## Known technical note

Current Annotorious version may warn about unsupported filter props if `filter={...}` is passed directly to `ImageAnnotator`.

Preferred stable approach:

* load/render annotations explicitly through `setAnnotations(...)`;
* keep UI filtering in React state;
* avoid relying on unsupported Annotorious filter behavior unless the library version fully supports it.

---

## Next improvements

* Move annotator logic into smaller hooks:

  * `useAnnotationRendering`;
  * `useAnnotationSelection`;
  * `useAnnotationFilters`;
  * `useAnnotationAiReview`.
* Add regression tests for:

  * reload rendering;
  * one-click selection;
  * annotation source normalization;
  * unchanged geometry guard.
* Localize all remaining annotator panel strings.
