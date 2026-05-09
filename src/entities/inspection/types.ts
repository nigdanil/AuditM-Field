import type { z } from 'zod';

import type {
  createInspectionInputSchema,
  inspectionSchema,
  inspectionStatusSchema,
  updateInspectionInputSchema,
} from './schemas';

export type InspectionStatus = z.infer<typeof inspectionStatusSchema>;

export type Inspection = z.infer<typeof inspectionSchema>;

export type CreateInspectionInput = z.infer<typeof createInspectionInputSchema>;

export type UpdateInspectionInput = z.infer<typeof updateInspectionInputSchema>;
