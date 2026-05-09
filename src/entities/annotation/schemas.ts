import { z } from 'zod';

export const annotationSourceSchema = z.enum(['human', 'ai', 'imported']);

export const imageAnnotationRecordSchema = z.object({
  id: z.string().min(1),
  photoId: z.string().min(1),
  inspectionId: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
  source: annotationSourceSchema,
  rawAnnotation: z.unknown(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  comment: z.string().optional(),
});

export const createImageAnnotationInputSchema = z.object({
  photoId: z.string().min(1),
  inspectionId: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
  rawAnnotation: z.unknown(),
  source: annotationSourceSchema.optional().default('human'),
  comment: z.string().optional(),
});
