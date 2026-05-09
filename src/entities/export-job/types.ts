import type { z } from 'zod';

import type {
  createExportJobInputSchema,
  exportJobAdapterIdSchema,
  exportJobSchema,
  exportJobStatusSchema,
  updateExportJobInputSchema,
} from './schemas';

export type ExportJobStatus = z.infer<typeof exportJobStatusSchema>;

export type ExportJobAdapterId = z.infer<typeof exportJobAdapterIdSchema>;

export type ExportJob = z.infer<typeof exportJobSchema>;

export type CreateExportJobInput = z.infer<typeof createExportJobInputSchema>;

export type UpdateExportJobInput = z.infer<typeof updateExportJobInputSchema>;
