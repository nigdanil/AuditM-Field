# MVP-12 / MVP-12.1 Release Notes

## Summary

This milestone adds the localization foundation and stabilizes the photo annotation workflow after navigation and page reload.

---

## Added

- i18next integration.
- react-i18next integration.
- RU/EN translation resources.
- Language switcher in the app header.
- Gradual localization support through `LegacyUiLocalizer`.
- Localized dashboard page.
- Localized inspections list page.
- Localized photo annotator entry page.
- Localized settings page.

---

## Improved

- Photo annotation rendering after page navigation.
- Saved annotation rendering after page reload.
- Annotation selection after page reload.
- One-click selection for saved annotations.
- Annotation source/type filtering UX.
- AI suggestion review panel.
- Dynamic annotation form integration.
- AI metadata display.
- Invalid geometry guard.

---

## Fixed

- Saved annotations could exist in IndexedDB but not render on the image.
- Annotation selection could be reset after layer synchronization.
- Annotation geometry could be re-saved even when only temporary `blob:` image source changed.
- After reload, first click on an annotation could update storage and reset selection, requiring a second click.

---

## Technical notes

The key fix is to normalize stored annotation payloads for the current image object URL before comparing or rendering them.

```text
stored raw annotation
  -> normalize id
  -> normalize target.source to current objectUrl
  -> compare with selected Annotorious payload
  -> skip IndexedDB update if unchanged
```

This keeps Annotorious rendering stable and prevents unnecessary Dexie/useLiveQuery refresh cycles.

---

## Result

The annotator now behaves as expected:

* annotations persist locally;
* annotations render after reload;
* annotations can be selected with one click;
* selected state is reflected in the image and the side panel;
* AI review and dynamic forms remain available.
