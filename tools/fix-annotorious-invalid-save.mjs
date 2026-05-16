import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'src/pages/photo-annotator/PhotoAnnotatorPage.tsx';
let source = readFileSync(filePath, 'utf8');

function replaceOrThrow(pattern, replacement, label) {
  const nextSource = source.replace(pattern, replacement);

  if (nextSource === source) {
    throw new Error(`Patch failed: ${label}`);
  }

  source = nextSource;
}

// Track ids that were really loaded into Annotorious.
if (!source.includes('const renderedAnnotationIdsRef = useRef<Set<string>>(new Set());')) {
  replaceOrThrow(
    /  const selectedAnnotationIdRef = useRef<string \| null>\(selectedAnnotationId\);/,
    `  const selectedAnnotationIdRef = useRef<string | null>(selectedAnnotationId);
  const renderedAnnotationIdsRef = useRef<Set<string>>(new Set());`,
    'add renderedAnnotationIdsRef',
  );
}

// Save rendered ids while loading annotations into Annotorious.
replaceOrThrow(
  /      const rawAnnotations = visibleAnnotationRecords\s*\.map\(\(record\) => record\.rawAnnotation\)\s*\.filter\(isRenderableRawAnnotation\)\s*\.map\(\(rawAnnotation\) => rawAnnotation as Partial<unknown>\);\s*annotator\.setAnnotations\(rawAnnotations, true\);/,
  `      const renderableAnnotationRecords = visibleAnnotationRecords.filter((record) =>
        isRenderableRawAnnotation(record.rawAnnotation),
      );

      renderedAnnotationIdsRef.current = new Set(
        renderableAnnotationRecords.map((record) => record.id),
      );

      const rawAnnotations = renderableAnnotationRecords.map(
        (record) => record.rawAnnotation as Partial<unknown>,
      );

      annotator.setAnnotations(rawAnnotations, true);`,
  'track rendered annotations',
);

// Do not overwrite DB with invalid selected geometry.
if (!source.includes('if (!isRenderableRawAnnotation(selectedAnnotoriousAnnotation))')) {
  replaceOrThrow(
    /    if \(!selectedAnnotoriousAnnotation \|\| !annotationId\) \{\s*return undefined;\s*\}\s*return updateAnnotationRawPayload\(\{/,
    `    if (!selectedAnnotoriousAnnotation || !annotationId) {
      return undefined;
    }

    if (!isRenderableRawAnnotation(selectedAnnotoriousAnnotation)) {
      return undefined;
    }

    return updateAnnotationRawPayload({`,
    'guard flushSelectedAnnotationGeometry',
  );
}

// Do not select ids that were not loaded into Annotorious.
replaceOrThrow(
  /    if \(\s*!selectedVisibleAnnotation \|\|\s*!isRenderableRawAnnotation\(selectedVisibleAnnotation\.rawAnnotation\)\s*\) \{\s*return;\s*\}/,
  `    if (
      !selectedVisibleAnnotation ||
      !renderedAnnotationIdsRef.current.has(selectedAnnotationId) ||
      !isRenderableRawAnnotation(selectedVisibleAnnotation.rawAnnotation)
    ) {
      return;
    }`,
  'guard selected annotation effect',
);

// Give Annotorious a little more time after pointerup.
source = source.replace(/}, 50\);/g, '}, 150);');

// Do not create records from invalid geometry.
if (!source.includes('Annotation was not saved: invalid geometry')) {
  replaceOrThrow(
    /    const handleCreateAnnotation = async \(annotation: unknown\) => \{\s*const savedAnnotation = await upsertAnnotationFromAnnotorious\(\{/,
    `    const handleCreateAnnotation = async (annotation: unknown) => {
      if (!isRenderableRawAnnotation(annotation)) {
        setStatusMessage('Annotation was not saved: invalid geometry. Try drawing it again.');
        return;
      }

      const savedAnnotation = await upsertAnnotationFromAnnotorious({`,
    'guard create annotation',
  );
}

// Do not update records with invalid geometry.
if (!source.includes('Annotation geometry update was ignored: invalid geometry.')) {
  replaceOrThrow(
    /    const handleUpdateAnnotation = async \(annotation: unknown\) => \{\s*const annotationId = getRawAnnotationId\(annotation\) \?\? selectedAnnotationIdRef\.current \?\? undefined;/,
    `    const handleUpdateAnnotation = async (annotation: unknown) => {
      if (!isRenderableRawAnnotation(annotation)) {
        setStatusMessage('Annotation geometry update was ignored: invalid geometry.');
        return;
      }

      const annotationId = getRawAnnotationId(annotation) ?? selectedAnnotationIdRef.current ?? undefined;`,
    'guard update annotation',
  );
}

// Avoid "Invalid selection ..." warnings when clicking panel item that is not rendered.
replaceOrThrow(
  /  const handleSelectAnnotation = \(annotationId: string\) => \{\s*setSelectedAnnotationId\(annotationId\);\s*annotator\?\.setSelected\(annotationId, true\);\s*\};/,
  `  const handleSelectAnnotation = (annotationId: string) => {
    setSelectedAnnotationId(annotationId);

    if (!annotator || !renderedAnnotationIdsRef.current.has(annotationId)) {
      return;
    }

    annotator.setSelected(annotationId, true);
  };`,
  'guard handleSelectAnnotation',
);

writeFileSync(filePath, source);
console.log('Patched PhotoAnnotatorPage.tsx');
