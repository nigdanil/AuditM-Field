# Photo Annotator

The Photo Annotator is the core visual evidence workspace in AuditM-Field. It allows the user to draw rectangular annotations on imported photos, classify areas by type, fill dynamic forms, view supervisor markup and review AI-generated suggestions.

---

## Main capabilities

* Draw rectangular annotations.
* Select annotation type from active JSON config.
* Render annotation colors from config.
* Store annotations locally in IndexedDB.
* Display saved annotations after navigation and reload.
* Filter visible annotations by type.
* Filter annotations by source:

  * all;
  * human;
  * AI;
  * pending AI;
  * imported.
* Fill dynamic annotation-level forms.
* Display AI metadata.
* Accept/reject AI suggestions when permission allows it.
* View annotations in read-only mode when editing is not allowed.

---

## Role-aware behavior

The same annotator supports edit and read-only modes.

### Edit mode

Used for supervisor/admin scenarios.

Allowed actions:

* create annotation;
* select annotation;
* edit geometry;
* fill dynamic form;
* delete annotation;
* accept AI suggestion;
* reject AI suggestion;
* clear pending AI suggestions.

### Read-only mode

Used for merchandiser/viewer scenarios.

Allowed actions:

* open photo;
* see existing annotations;
* filter annotations;
* select annotation;
* inspect dynamic form values;
* inspect AI metadata where visible.

Blocked actions:

* create annotation;
* edit geometry;
* save annotation form;
* delete annotation;
* accept/reject AI suggestion;
* clear pending AI suggestions.

This supports the workflow where a merchandiser views supervisor markup without changing it.

---

## Annotation sources

Annotations can have different sources:

| Source     | Meaning                                          |
| ---------- | ------------------------------------------------ |
| `human`    | Created or accepted by a human user              |
| `ai`       | Imported as AI suggestion                        |
| `imported` | Imported from external package or transport flow |

Pending AI suggestions are identified by AI review metadata.

---

## AI review flow

```text
Import AI suggestions
  -> Show pending AI annotations
  -> User reviews visual area and metadata
  -> Accept -> source changes to human -> AI metadata is preserved
  -> Reject -> annotation is deleted
```

The PWA does not run AI models directly. AI/OCR/CV/LLM/RAG should run behind backend or n8n workflows.

Read-only roles can view suggestions but cannot accept/reject them.

---

## Stability fixes

### Problem 1: annotation rendering after navigation/reload

Saved annotations could be stored in IndexedDB but not rendered correctly on the image.

In some cases, after page reload the user had to click an annotation twice before it remained selected.

### Root cause

Browser image URLs are temporary:

```text
blob:...
```

After page reload, the same stored photo receives a new `blob:` URL. If saved annotation payload contains the previous `target.source`, Annotorious can treat the annotation as connected to a different image source.

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

## Stability fixes for leaving the page

### Problem 2: console errors when leaving with selected annotation

When the user left the annotator while an annotation was selected in edit mode, Annotorious could keep SVG handles active during component unmount.

Symptoms:

```text
<rect> attribute x: Expected length, "-Infinity"
<rect> attribute width: Expected length, "Infinity"
<line> attribute x2: Expected length, "NaN"
<circle> attribute r: Expected length, "Infinity"
```

### Implemented solution

* Detect navigation intent in capture phase.
* Clear selected annotation in React state before route transition.
* Call Annotorious selection cleanup safely.
* Keep annotation rendering intact.
* Avoid blocking render with overly strict image readiness guards.

Expected result:

```text
User can select annotation
  -> click Back / Dashboard / Inspections / Export
  -> no Annotorious SVG errors
  -> annotations remain saved
```

---

## Filtering approach

Current Annotorious version may warn about unsupported filter props if `filter={...}` is passed directly to `ImageAnnotator`.

Preferred stable approach:

* keep filter state in React;
* calculate visible annotation records;
* render the visible set explicitly through `setAnnotations(...)`;
* avoid relying on unsupported Annotorious filter behavior unless the library version fully supports it.

---

## Expected behavior

After the latest fixes:

* annotations are visible after navigation;
* annotations are visible after page reload;
* existing annotation is selected with one click;
* selected annotation is highlighted on the image;
* selected annotation is highlighted in the right-side list;
* dynamic form opens for the selected annotation;
* edit mode and read-only mode use the same workspace safely;
* leaving the annotator with selected annotation does not produce console errors;
* geometry updates are saved only when actually changed;
* AI suggestions can still be accepted, rejected or cleared by allowed roles.

---

## Next improvements

* Move annotator logic into smaller hooks:

  * `useAnnotationRendering`;
  * `useAnnotationSelection`;
  * `useAnnotationFilters`;
  * `useAnnotationAiReview`;
  * `useAnnotatorNavigationCleanup`.
* Add regression tests for:

  * reload rendering;
  * one-click selection;
  * annotation source normalization;
  * unchanged geometry guard;
  * read-only annotation mode;
  * selection cleanup before navigation.
* Add keyboard shortcuts for selection clearing.
* Add better mobile touch handling.
