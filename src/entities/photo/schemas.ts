import { z } from 'zod';

export const photoRecordMetadataSchema = z.object({
  id: z.string().min(1),
  inspectionId: z.string().min(1),
  type: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  createdAt: z.string().datetime(),
  comment: z.string().optional(),
});

export const createPhotoInputSchema = z.object({
  inspectionId: z.string().min(1),
  type: z.string().min(1),
  comment: z.string().optional(),
});

export type PhotoRecordMetadata = z.infer<typeof photoRecordMetadataSchema>;

export type CreatePhotoInputBase = z.infer<typeof createPhotoInputSchema>;
