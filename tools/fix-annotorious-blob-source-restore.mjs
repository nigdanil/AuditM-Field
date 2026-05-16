import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'src/pages/photo-annotator/PhotoAnnotatorPage.tsx';
let source = readFileSync(filePath, 'utf8');

function replaceIfFound(pattern, replacement, label) {
  const nextSource = source.replace(pattern, replacement);

  if (nextSource === source) {
    console.log(`skip: ${label}`);
    return false;
  }

  source = nextSource;
  console.log(`patched: ${label}`);
  return true;
}

function replaceEffectContaining(marker, replacement, label) {
  const markerIndex = source.indexOf(marker);

  if (markerIndex === -1) {
    console.log(`skip: ${label} marker not found`);
    return false;
  }

  const start = source.lastIndexOf('  useEffect(() => {', markerIndex);
  const depsStart = source.indexOf('\n  }, [', markerIndex);
  const end = source.indexOf(');', depsStart) + 3;

  if (start === -1 || depsStart === -1 || end === 2) {
    console.log(`skip: ${label} bounds not found`);
    return false;
  }

  source = source.slice(0, start) + replacement + source.slice(end);
  console.log(`patched: ${label}`);
  return true;
}

if (!source.includes('const [imageReady, setImageReady] = useState(false);')) {
  replaceIfFound(
    /  const \[objectUrl, setObjectUrl\] = useState<string \| null>\(null\);/,
    `  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);`,
    'add imageReady state',
  );
}

if (!source.includes('function normalizeRawAnnotationForImage(')) {
  replaceIfFound(
    /function isRenderableRawAnnotation\(rawAnnotation: unknown\): boolean \{[\s\S]*?\n\}\n\nfunction PhotoAnnotationWorkspace/,
    `function isRenderableRawAnnotation(rawAnnotation: unknown): boolean {
  if (!rawAnnotation || typeof rawAnnotation !== 'object') {
    return false;
  }

  return !hasInvalidAnnotationGeometryValue(rawAnnotation);
}

type RawAnnotationObject = Record<string, unknown>;

function normalizeRawAnnotationTargetForImage(target: unknown, imageSource: string): unknown {
  if (Array.isArray(target)) {
    return target.map((item) => normalizeRawAnnotationTargetForImage(item, imageSource));
  }

  if (target && typeof target === 'object') {
    return {
      ...(target as RawAnnotationObject),
      source: imageSource,
    };
  }

  return target;
}

function normalizeRawAnnotationForImage(
  rawAnnotation: unknown,
  imageSource: string,
  annotationId: string,
): unknown {
  if (!rawAnnotation || typeof rawAnnotation !== 'object') {
    return rawAnnotation;
  }

  const normalizedAnnotation: RawAnnotationObject = {
    ...(rawAnnotation as RawAnnotationObject),
    id: annotationId,
  };

  if ('target' in normalizedAnnotation) {
    normalizedAnnotation.target = normalizeRawAnnotationTargetForImage(
      normalizedAnnotation.target,
      imageSource,
    );
  }

  return normalizedAnnotation;
}

function PhotoAnnotationWorkspace`,
    'add normalizeRawAnnotationForImage helpers',
  );
}

if (!source.includes('const renderedAnnotationIdsRef = useRef<Set<string>>(new Set());')) {
  replaceIfFound(
    /  const selectedAnnotationIdRef = useRef<string \| null>\(selectedAnnotationId\);/,
    `  const selectedAnnotationIdRef = useRef<string | null>(selectedAnnotationId);
  const renderedAnnotationIdsRef = useRef<Set<string>>(new Set());`,
    'add renderedAnnotationIdsRef',
  );
}

source = source.replace(
  /\n\s*const annotationRecordsRef = useRef<ImageAnnotationRecord\[\]>\(annotationRecords\);/g,
  '',
);

source = source.replace(
  /\n\s*useEffect\(\(\) => \{\s*annotationRecordsRef\.current = annotationRecords;\s*\}, \[annotationRecords\]\);\s*/g,
  '\n',
);

if (!source.includes('setImageReady(false);\n    setObjectUrl(nextObjectUrl);')) {
  replaceEffectContaining(
    'URL.createObjectURL(photo.blob)',
    `  useEffect(() => {
    const nextObjectUrl = URL.createObjectURL(photo.blob);

    setImageReady(false);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [photo.blob]);`,
    'objectUrl effect',
  );
}

replaceEffectContaining(
  'annotator.setAnnotations(rawAnnotations, true)',
  `  useEffect(() => {
    if (!annotator || !imageReady || !objectUrl) {
      renderedAnnotationIdsRef.current = new Set();
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const renderableAnnotationRecords = visibleAnnotationRecords
        .map((record) => ({
          record,
          rawAnnotation: normalizeRawAnnotationForImage(record.rawAnnotation, objectUrl, record.id),
        }))
        .filter(({ rawAnnotation }) => isRenderableRawAnnotation(rawAnnotation));

      renderedAnnotationIdsRef.current = new Set(
        renderableAnnotationRecords.map(({ record }) => record.id),
      );

      const rawAnnotations = renderableAnnotationRecords.map(
        ({ rawAnnotation }) => rawAnnotation as Partial<unknown>,
      );

      annotator.setAnnotations(rawAnnotations, true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [annotator, imageReady, objectUrl, rawAnnotationRevision, visibleAnnotationRecords]);`,
  'setAnnotations effect',
);

replaceEffectContaining(
  'annotator.setSelected(selectedAnnotationId, true)',
  `  useEffect(() => {
    if (!annotator || !imageReady || !selectedAnnotationId) {
      return;
    }

    const selectedVisibleAnnotation = visibleAnnotationRecords.find(
      (annotation) => annotation.id === selectedAnnotationId,
    );

    if (
      !selectedVisibleAnnotation ||
      !renderedAnnotationIdsRef.current.has(selectedAnnotationId) ||
      !isRenderableRawAnnotation(selectedVisibleAnnotation.rawAnnotation)
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      annotator.setSelected(selectedAnnotationId, true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [annotator, imageReady, rawAnnotationRevision, selectedAnnotationId, visibleAnnotationRecords]);`,
  'setSelected effect',
);

if (!source.includes('Selected annotation geometry is invalid. Geometry update skipped.')) {
  replaceIfFound(
    /    if \(!selectedAnnotoriousAnnotation \|\| !annotationId\) \{\s*return undefined;\s*\}\s*return updateAnnotationRawPayload\(\{/,
    `    if (!selectedAnnotoriousAnnotation || !annotationId) {
      return undefined;
    }

    if (!isRenderableRawAnnotation(selectedAnnotoriousAnnotation)) {
      console.warn('Selected annotation geometry is invalid. Geometry update skipped.');
      return undefined;
    }

    return updateAnnotationRawPayload({`,
    'guard flushSelectedAnnotationGeometry',
  );
}

if (!source.includes('Annotation was not saved: invalid geometry')) {
  replaceIfFound(
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

if (!source.includes('Annotation geometry update was ignored: invalid geometry.')) {
  replaceIfFound(
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

if (!source.includes('!renderedAnnotationIdsRef.current.has(annotationId)')) {
  replaceIfFound(
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
}

source = source.replace(/\}, 50\);/g, '}, 150);');

if (!source.includes('onLoad={() => setImageReady(true)}')) {
  replaceIfFound(
    /<img\s+src=\{objectUrl\}\s+alt=\{photo\.fileName\}\s+className="mx-auto max-h-\[680px\] w-auto max-w-full rounded-xl object-contain"\s+\/>/,
    `<img
            key={objectUrl}
            src={objectUrl}
            alt={photo.fileName}
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(false)}
            className="mx-auto max-h-[680px] w-auto max-w-full rounded-xl object-contain"
          />`,
    'add img onLoad/onError',
  );
}

if (!source.includes('<ImageAnnotator\n          key={objectUrl}')) {
  replaceIfFound(
    /<ImageAnnotator\s*\n\s*userSelectAction=/,
    `<ImageAnnotator
          key={objectUrl}
          userSelectAction=`,
    'add ImageAnnotator key',
  );
}

writeFileSync(filePath, source);
console.log('Done. Check PhotoAnnotatorPage.tsx and run npm run build.');
