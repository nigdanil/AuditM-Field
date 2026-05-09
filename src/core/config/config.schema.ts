import { z } from 'zod';

export const dynamicFieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'select',
  'multiselect',
  'boolean',
  'radio',
  'date',
]);

export const fieldOptionSchema = z.object({
  value: z.string().min(1, 'Option value is required'),
  label: z.string().min(1, 'Option label is required'),
});

export const dynamicFieldConfigSchema = z.object({
  id: z.string().min(1, 'Field id is required'),
  type: dynamicFieldTypeSchema,
  label: z.string().min(1, 'Field label is required'),
  required: z.boolean().optional().default(false),
  dictionary: z.string().min(1).optional(),
  options: z.array(fieldOptionSchema).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
});

export const photoTypeConfigSchema = z.object({
  id: z.string().min(1, 'Photo type id is required'),
  label: z.string().min(1, 'Photo type label is required'),
  description: z.string().optional(),
});

export const annotationShapeSchema = z.enum(['rectangle', 'point', 'polygon']);

export const annotationTypeConfigSchema = z.object({
  id: z.string().min(1, 'Annotation type id is required'),
  label: z.string().min(1, 'Annotation type label is required'),
  shape: annotationShapeSchema.optional().default('rectangle'),
  color: z.string().optional(),
  description: z.string().optional(),
});

export const exportSettingsSchema = z.object({
  packageNamePrefix: z.string().min(1).optional().default('auditm_field_export'),
  includeConfig: z.boolean().optional().default(true),
  includeSchemas: z.boolean().optional().default(true),
});

export const auditConfigSchema = z.object({
  id: z.string().min(1, 'Config id is required'),
  name: z.string().min(1, 'Config name is required'),
  version: z.string().min(1, 'Config version is required'),
  description: z.string().optional(),

  photoTypes: z.array(photoTypeConfigSchema).min(1, 'At least one photo type is required'),
  annotationTypes: z
    .array(annotationTypeConfigSchema)
    .min(1, 'At least one annotation type is required'),

  dictionaries: z.record(z.string(), z.array(z.string())).optional().default({}),

  inspectionForm: z.array(dynamicFieldConfigSchema).optional().default([]),
  photoForm: z.array(dynamicFieldConfigSchema).optional().default([]),
  annotationForm: z.array(dynamicFieldConfigSchema).optional().default([]),

  exportSettings: exportSettingsSchema.optional().default({
    packageNamePrefix: 'auditm_field_export',
    includeConfig: true,
    includeSchemas: true,
  }),
});
