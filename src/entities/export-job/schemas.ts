import { z } from 'zod';

export const exportJobStatusValues = ['PENDING', 'UPLOADING', 'SUCCESS', 'FAILED'] as const;

export const exportJobAdapterIdValues = [
  'local-download',
  'http-upload',
  'webhook',
] as const;

export const exportJobStatusSchema = z.enum(exportJobStatusValues);

export const exportJobAdapterIdSchema = z.enum(exportJobAdapterIdValues);

export const exportJobSchema = z.object({
  id: z.string().min(1),
  inspectionId: z.string().min(1),
  inspectionTitle: z.string().min(1),
  adapterId: exportJobAdapterIdSchema,
  status: exportJobStatusSchema,
  fileName: z.string().min(1),
  packageSize: z.number().int().nonnegative(),
  targetUrl: z.string().optional(),
  attempts: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  responseStatus: z.number().int().optional(),
  responseText: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export const createExportJobInputSchema = z.object({
  inspectionId: z.string().min(1),
  inspectionTitle: z.string().min(1),
  adapterId: exportJobAdapterIdSchema,
  fileName: z.string().min(1),
  packageSize: z.number().int().nonnegative(),
  targetUrl: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateExportJobInputSchema = z.object({
  status: exportJobStatusSchema.optional(),
  attempts: z.number().int().nonnegative().optional(),
  targetUrl: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  responseStatus: z.number().int().optional(),
  responseText: z.string().optional(),
  errorMessage: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});
