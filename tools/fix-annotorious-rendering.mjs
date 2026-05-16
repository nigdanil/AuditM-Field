import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'src/pages/photo-annotator/PhotoAnnotatorPage.tsx';
let source = readFileSync(filePath, 'utf8');

const helperMarker = '\nfunction PhotoAnnotationWorkspace';

if (!source.includes('function hasInvalidAnnotationGeometryValue')) {
  source = source.replace(
    helperMarker,
    `
function hasInvalidAnnotationGeometryValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return !Number.isFinite(value);
  }

  if (typeof value === 'string') {
    return /(^|[^a-zA-Z])(NaN|Infinity|-Infinity)([^a-zA-Z]|$)/.test(value);
  }

  if (Array.isArray(value)) {
    return value.some(hasInvalidAnnotationGeometryValue);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some(hasInvalidAnnotationGeometryValue);
  }

  return false;
}

function isRenderableRawAnnotation(rawAnnotation: unknown): boolean {
  if (!rawAnnotation || typeof rawAnnotation !== 'object') {
    return false;
  }

  return !hasInvalidAnnotationGeometryValue(rawAnnotation);
}
${helperMarker}`,
  );
}

source = source.replace(
  `  const [objectUrl, setObjectUrl] = useState<string | null>(null);
`,
  `  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
`,
);

source = source.replace(
  `  useEffect(() => {
    const nextObjectUrl = URL.createObjectURL(photo.blob);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [photo.blob]);`,
  `  useEffect(() => {
    const nextObjectUrl = URL.createObjectURL(photo.blob);

    setImageReady(false);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [photo.blob]);`,
);

const filterStartMarker = '  const annotationFilter = (annotation: ImageAnnotation): boolean => {';
const filterEndMarker = '  const toggleVisibleAnnotationType';

const filterStart = source.indexOf(filterStartMarker);
const filterEnd = source.indexOf(filterEndMarker, filterStart);

if (filterStart !== -1 && filterEnd !== -1) {
  source = source.slice(0, filterStart) + source.slice(filterEnd);
}

source = source.replace(/\n\s+filter=\{annotationFilter\}/g, '');

const effectStartMarker = `  useEffect(() => {
    if (!annotator) {
      return;
    }

    const rawAnnotations`;

const effectStart = source.indexOf(effectStartMarker);
const setAnnotationsIndex = source.indexOf('annotator.setAnnotations', effectStart);

if (effectStart !== -1 && setAnnotationsIndex !== -1) {
  const effectEndStart = source.indexOf('  }, [annotator', setAnnotationsIndex);
  const effectEnd = source.indexOf(');', effectEndStart) + 3;

  if (effectEndStart === -1 || effectEnd === 2) {
    throw new Error('Could not find end of setAnnotations effect.');
  }

  const nextEffect = `  useEffect(() => {
    if (!annotator || !imageReady) {
      return;
    }

    const rawAnnotations = visibleAnnotationRecords
      .map((record) => record.rawAnnotation)
      .filter(isRenderableRawAnnotation)
      .map((rawAnnotation) => rawAnnotation as Partial<unknown>);

    annotator.setAnnotations(rawAnnotations, true);
  }, [annotator, imageReady, rawAnnotationRevision, visibleAnnotationRecords]);`;

  source = source.slice(0, effectStart) + nextEffect + source.slice(effectEnd);
}

if (!source.includes('onLoad={() => setImageReady(true)}')) {
  source = source.replace(
    `          <img
            src={objectUrl}
            alt={photo.fileName}
            className=`,
    `          <img
            key={objectUrl}
            src={objectUrl}
            alt={photo.fileName}
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(false)}
            className=`,
  );
}

writeFileSync(filePath, source);
console.log('Patched Annotorious rendering guard.');
