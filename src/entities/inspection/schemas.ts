import { z } from 'zod';

export const inspectionStatusValues = [
  'DRAFT',
  'READY',
  'EXPORTED',
  'SYNC_PENDING',
  'SYNCED',
  'SYNC_FAILED',
  'ARCHIVED',
] as const;

export const inspectionStatusSchema = z.enum(inspectionStatusValues);

export const inspectionSchema = z.object({
  id: z.string().min(1),
  configId: z.string().min(1),
  configName: z.string().min(1),
  title: z.string().min(1),
  locationName: z.string().optional(),
  address: z.string().optional(),
  status: inspectionStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  comment: z.string().optional(),
});

export const createInspectionInputSchema = z.object({
  configId: z.string().min(1),
  configName: z.string().min(1),
  title: z.string().min(1, 'Inspection title is required'),
  locationName: z.string().optional(),
  address: z.string().optional(),
  comment: z.string().optional(),
});

export const updateInspectionInputSchema = z.object({
  title: z.string().min(1).optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  comment: z.string().optional(),
  status: inspectionStatusSchema.optional(),
});
