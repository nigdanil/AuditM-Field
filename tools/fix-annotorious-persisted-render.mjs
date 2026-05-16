import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'src/pages/photo-annotator/PhotoAnnotatorPage.tsx';
let source = readFileSync(filePath, 'utf8');

function replaceEffectContaining(marker, replacement, label) {
  const markerIndex = source.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Marker not found: ${label}`);
  }

  const start = source.lastIndexOf('\n  useEffect(() => {', markerIndex);
  const depsStart = source.indexOf('\n  }, [', markerIndex);
  const end = source.indexOf(');', depsStart) + 3;

  if (start === -1 || depsStart === -1 || end === 2) {
    throw new Error(`Could not locate useEffect bounds: ${label}`);
  }

  source = source.slice(0, start) + '\n' + replacement + source.slice(end);
}

// 1. Add imageReady state if missing
if (!source.includes('const [imageReady, setImageReady] = useState(false);')) {
  source = source.replace(
    '  const [objectUrl, setObjectUrl] = useState<string | null>(null);',
    `  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);`,
  );
}

// 2. Remove annotationRecordsRef, because it bypasses visible/renderable filtering
source = source.replace(
  /\n\s*const annotationRecordsRef = useRef<ImageAnnotationRecord\[\]>\(annotationRecords\);/g,
  '',
);

source = source.replace(
  /\n\s*useEffect\(\(\) => \{\s*annotationRecordsRef\.current = annotationRecords;\s*\}, \[annotationRecords\]\);\s*/g,
  '\n',
);

// 3. Replace objectUrl effect
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

// 4. Replace setAnnotations effect
replaceEffectContaining(
  'annotator.setAnnotations(rawAnnotations, true)',
  `  useEffect(() => {
    if (!annotator || !imageReady) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const rawAnnotations = visibleAnnotationRecords
        .map((record) => record.rawAnnotation)
        .filter(isRenderableRawAnnotation)
        .map((rawAnnotation) => rawAnnotation as Partial<unknown>);

      annotator.setAnnotations(rawAnnotations, true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [annotator, imageReady, rawAnnotationRevision, visibleAnnotationRecords]);`,
  'setAnnotations effect',
);

// 5. Replace setSelected effect
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

// 6. Add img onLoad/onError and key
if (!source.includes('onLoad={() => setImageReady(true)}')) {
  source = source.replace(
    /<img\s+src=\{objectUrl\}\s+alt=\{photo\.fileName\}\s+className="mx-auto max-h-\[680px\] w-auto max-w-full rounded-xl object-contain"\s+\/>/,
    `<img
            key={objectUrl}
            src={objectUrl}
            alt={photo.fileName}
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(false)}
            className="mx-auto max-h-[680px] w-auto max-w-full rounded-xl object-contain"
          />`,
  );
}

// 7. Force ImageAnnotator remount when photo object URL changes
if (!source.includes('<ImageAnnotator\n          key={objectUrl}')) {
  source = source.replace(
    /<ImageAnnotator\s*\n\s*userSelectAction=/,
    `<ImageAnnotator
          key={objectUrl}
          userSelectAction=`,
  );
}

writeFileSync(filePath, source);
console.log('Patched PhotoAnnotatorPage.tsx');
