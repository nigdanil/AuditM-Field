import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'src/shared/i18n/legacyUiTranslations.ts';
const source = readFileSync(filePath, 'utf8');

const objectStart = source.indexOf('export const legacyRuTextByEn');
const objectEnd = source.indexOf('};', objectStart);

if (objectStart === -1 || objectEnd === -1) {
  throw new Error('legacyRuTextByEn object was not found.');
}

const before = source.slice(0, objectStart);
const objectBlock = source.slice(objectStart, objectEnd + 2);
const after = source.slice(objectEnd + 2);

const seenKeys = new Set();
const lines = objectBlock.split('\n');

const nextLines = lines.filter((line) => {
  const match = line.match(/^\s*'([^']+)':/);

  if (!match) {
    return true;
  }

  const key = match[1];

  if (seenKeys.has(key)) {
    console.log(`Removed duplicate key: ${key}`);
    return false;
  }

  seenKeys.add(key);
  return true;
});

writeFileSync(filePath, before + nextLines.join('\n') + after);
