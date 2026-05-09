import type { z } from 'zod';

import type {
  annotationTypeConfigSchema,
  auditConfigSchema,
  dynamicFieldConfigSchema,
  exportSettingsSchema,
  photoTypeConfigSchema,
} from './config.schema';

export type DynamicFieldConfig = z.infer<typeof dynamicFieldConfigSchema>;

export type PhotoTypeConfig = z.infer<typeof photoTypeConfigSchema>;

export type AnnotationTypeConfig = z.infer<typeof annotationTypeConfigSchema>;

export type ExportSettings = z.infer<typeof exportSettingsSchema>;

export type AuditConfig = z.infer<typeof auditConfigSchema>;

export type ConfigLoadSource = 'demo' | 'local-file' | 'url' | 'github';

export interface ActiveConfigState {
  config: AuditConfig;
  loadedAt: string;
  source: ConfigLoadSource;
}
