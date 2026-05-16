import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'src/pages/photo-annotator/PhotoAnnotatorPage.tsx';
const source = readFileSync(filePath, 'utf8');

const startMarker = '  const annotationFilter = (annotation: ImageAnnotation): boolean => {';
const endMarker = '  const toggleVisibleAnnotationType';

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start === -1) {
  console.log('annotationFilter was not found. Nothing to remove.');
  process.exit(0);
}

if (end === -1) {
  throw new Error('Could not find toggleVisibleAnnotationType after annotationFilter.');
}

const nextSource = source.slice(0, start) + source.slice(end);

writeFileSync(filePath, nextSource);
console.log('Removed unused annotationFilter from PhotoAnnotatorPage.tsx');
