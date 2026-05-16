import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { translateLegacyUiTextToRu } from './legacyUiTranslations';

const textNodeOriginals = new WeakMap<Text, string>();

const elementAttributeOriginals = new WeakMap<Element, Partial<Record<LocalizableAttribute, string>>>();

const localizableAttributes = ['placeholder', 'title', 'aria-label'] as const;

type LocalizableAttribute = (typeof localizableAttributes)[number];

function isRussianLanguage(language: string | undefined): boolean {
  return language?.toLowerCase().startsWith('ru') ?? false;
}

function shouldSkipTextNode(node: Text): boolean {
  const parent = node.parentElement;

  if (!parent) {
    return true;
  }

  const tagName = parent.tagName.toLowerCase();

  return ['script', 'style', 'noscript'].includes(tagName);
}

function translateTextNode(node: Text, useRussian: boolean) {
  if (shouldSkipTextNode(node)) {
    return;
  }

  const currentValue = node.nodeValue ?? '';

  if (!currentValue.trim()) {
    return;
  }

  if (!useRussian) {
    const originalValue = textNodeOriginals.get(node);

    if (originalValue !== undefined && currentValue !== originalValue) {
      node.nodeValue = originalValue;
    }

    return;
  }

  const originalValue = textNodeOriginals.get(node) ?? currentValue;
  const translatedValue = translateLegacyUiTextToRu(originalValue);

  if (translatedValue !== originalValue) {
    textNodeOriginals.set(node, originalValue);

    if (currentValue !== translatedValue) {
      node.nodeValue = translatedValue;
    }
  }
}

function translateElementAttributes(element: Element, useRussian: boolean) {
  for (const attribute of localizableAttributes) {
    const currentValue = element.getAttribute(attribute);

    if (!currentValue?.trim()) {
      continue;
    }

    if (!useRussian) {
      const originals = elementAttributeOriginals.get(element);
      const originalValue = originals?.[attribute];

      if (originalValue !== undefined && currentValue !== originalValue) {
        element.setAttribute(attribute, originalValue);
      }

      continue;
    }

    const existingOriginals = elementAttributeOriginals.get(element) ?? {};
    const originalValue = existingOriginals[attribute] ?? currentValue;
    const translatedValue = translateLegacyUiTextToRu(originalValue);

    if (translatedValue !== originalValue) {
      elementAttributeOriginals.set(element, {
        ...existingOriginals,
        [attribute]: originalValue,
      });

      if (currentValue !== translatedValue) {
        element.setAttribute(attribute, translatedValue);
      }
    }
  }
}

function applyLegacyLocalization(root: ParentNode, useRussian: boolean) {
  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let textNode = textWalker.nextNode();

  while (textNode) {
    translateTextNode(textNode as Text, useRussian);
    textNode = textWalker.nextNode();
  }

  if (root instanceof Element) {
    translateElementAttributes(root, useRussian);
  }

  root.querySelectorAll?.('*').forEach((element) => {
    translateElementAttributes(element, useRussian);
  });
}

export function LegacyUiLocalizer() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    const useRussian = isRussianLanguage(language);
    let isApplying = false;

    const apply = () => {
      if (isApplying) {
        return;
      }

      isApplying = true;

      window.requestAnimationFrame(() => {
        applyLegacyLocalization(document.body, useRussian);
        isApplying = false;
      });
    };

    apply();

    const observer = new MutationObserver(() => {
      apply();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...localizableAttributes],
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return null;
}
