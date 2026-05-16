import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'src/pages/photo-annotator/PhotoAnnotatorPage.tsx';
let source = readFileSync(filePath, 'utf8');

source = source.replace(
  "\n  const annotationRecordsRef = useRef<ImageAnnotationRecord[]>(annotationRecords);\n",
  "\n",
);

source = source.replace(
  /\n  useEffect\(\(\) => \{\n    annotationRecordsRef\.current = annotationRecords;\n  \}, \[annotationRecords\]\);\n/g,
  "\n",
);

source = source.replace(
  /\n  const annotationFilter = \(annotation: ImageAnnotation\): boolean => \{[\s\S]*?\n  \};\n\n  const toggleVisibleAnnotationType/,
  "\n  const toggleVisibleAnnotationType",
);

source = source.replace(
  `    const rawAnnotations = annotationRecordsRef.current.map(
      (record) => record.rawAnnotation as Partial<unknown>,
    );

    annotator.setAnnotations(rawAnnotations, true);
  }, [annotator, rawAnnotationRevision]);`,
  `    const rawAnnotations = visibleAnnotationRecords.map(
      (record) => record.rawAnnotation as Partial<unknown>,
    );

    annotator.setAnnotations(rawAnnotations, true);
  }, [annotator, rawAnnotationRevision, visibleAnnotationRecords]);`,
);

source = source.replace(
  /\n          filter=\{annotationFilter\}/g,
  '',
);

writeFileSync(filePath, source);
