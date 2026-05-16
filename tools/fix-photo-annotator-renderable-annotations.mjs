import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'src/pages/photo-annotator/PhotoAnnotatorPage.tsx';
let source = readFileSync(filePath, 'utf8');

source = source.replace(
  /const \[objectUrl, setObjectUrl\] = useState<string \| null>\(null\);/,
  `const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);`,
);

source = source.replace(
  /\n\s*const annotationRecordsRef = useRef<ImageAnnotationRecord\[\]>\(annotationRecords\);/g,
  '',
);

source = source.replace(
  /\n\s*useEffect\(\(\) => \{\s*annotationRecordsRef\.current = annotationRecords;\s*\}, \[annotationRecords\]\);\s*/g,
  '\n',
);

source = source.replace(
  /useEffect\(\(\) => \{\s*const nextObjectUrl = URL\.createObjectURL\(photo\.blob\);\s*setObjectUrl\(nextObjectUrl\);\s*return \(\) => \{\s*URL\.revokeObjectURL\(nextObjectUrl\);\s*\};\s*\}, \[photo\.blob\]\);/g,
  `useEffect(() => {
    const nextObjectUrl = URL.createObjectURL(photo.blob);

    setImageReady(false);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [photo.blob]);`,
);

source = source.replace(
  /useEffect\(\(\) => \{\s*if \(!annotator\) \{\s*return;\s*\}\s*const rawAnnotations = annotationRecordsRef\.current\.map\(\s*\(record\) => record\.rawAnnotation as Partial<unknown>,\s*\);\s*annotator\.setAnnotations\(rawAnnotations, true\);\s*\}, \[annotator, rawAnnotationRevision\]\);/g,
  `useEffect(() => {
    if (!annotator || !imageReady) {
      return;
    }

    const rawAnnotations = visibleAnnotationRecords
      .map((record) => record.rawAnnotation)
      .filter(isRenderableRawAnnotation)
      .map((rawAnnotation) => rawAnnotation as Partial<unknown>);

    annotator.setAnnotations(rawAnnotations, true);
  }, [annotator, imageReady, rawAnnotationRevision, visibleAnnotationRecords]);`,
);

source = source.replace(
  /<img\s+src=\{objectUrl\}\s+alt=\{photo\.fileName\}\s+className="mx-auto max-h-\[680px\] w-auto max-w-full rounded-xl object-contain"\s+\/>/g,
  `<img
            key={objectUrl}
            src={objectUrl}
            alt={photo.fileName}
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(false)}
            className="mx-auto max-h-[680px] w-auto max-w-full rounded-xl object-contain"
          />`,
);

writeFileSync(filePath, source);
console.log('PhotoAnnotatorPage.tsx patched.');
