import type { z } from 'zod';

import type {
  annotationSourceSchema,
  createImageAnnotationInputSchema,
  imageAnnotationRecordSchema,
} from './schemas';

export type AnnotationSource = z.infer<typeof annotationSourceSchema>;

export type ImageAnnotationRecord = z.infer<typeof imageAnnotationRecordSchema>;

export type CreateImageAnnotationInput = z.infer<typeof createImageAnnotationInputSchema>;
