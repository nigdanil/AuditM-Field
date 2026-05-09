import { nanoid } from 'nanoid';
import { z } from 'zod';

import { createImageAnnotationRecord } from '../../entities/annotation/model';
import type { ImageAnnotationRecord } from '../../entities/annotation/types';
import { db } from '../db/db';

const aiAnnotationSuggestionSchema = z.object({
  id: z.string().min(1).optional(),
  photoId: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
  shape: z.enum(['rectangle', 'point', 'polygon']).optional().default('rectangle'),
  confidence: z.number().min(0).max(1).optional(),
  rawAnnotation: z.unknown().optional(),
  attributes: z.record(z.string(), z.unknown()).optional().default({}),
  comment: z.string().optional(),
});

const aiSuggestionsPackageSchema = z.object({
  schemaVersion: z.string().min(1).optional().default('1.0.0'),
  source: z.literal('ai'),
  provider: z.string().optional(),
  inspectionId: z.string().min(1),
  createdAt: z.string().optional(),
  suggestions: z.array(aiAnnotationSuggestionSchema).default([]),
  report: z
    .object({
      summary: z.string().optional(),
      warnings: z.array(z.string()).optional().default([]),
    })
    .optional(),
});

type AiAnnotationSuggestion = z.infer<typeof aiAnnotationSuggestionSchema>;

export type AiSuggestionsPackage = z.infer<typeof aiSuggestionsPackageSchema>;

export type ImportAiSuggestionsResult = {
  inspectionId: string;
  provider?: string;
  importedAt: string;
  suggestionsTotal: number;
  annotationsImported: number;
  skippedDuplicates: number;
  affectedPhotoIds: string[];
  firstPhotoId?: string;
  reportSummary?: string;
  warnings: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function readJsonFile(file: File): Promise<unknown> {
  try {
    return JSON.parse(await file.text()) as unknown;
  } catch {
    throw new Error('Invalid AI suggestions JSON file.');
  }
}

function withSuggestionId(rawAnnotation: unknown, id: string): unknown {
  if (isRecord(rawAnnotation)) {
    const existingId = rawAnnotation.id;

    if (typeof existingId === 'string' && existingId.trim()) {
      return rawAnnotation;
    }

    return {
      ...rawAnnotation,
      id,
    };
  }

  return {
    id,
    value: rawAnnotation ?? null,
  };
}

function buildSuggestionComment(input: {
  suggestion: AiAnnotationSuggestion;
  provider?: string;
}): string | undefined {
  const parts = [
    input.suggestion.comment?.trim(),
    input.provider ? `provider: ${input.provider}` : undefined,
    typeof input.suggestion.confidence === 'number'
      ? `confidence: ${input.suggestion.confidence}`
      : undefined,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : undefined;
}

function buildSuggestionAttributes(input: {
  suggestion: AiAnnotationSuggestion;
  provider?: string;
  importedAt: string;
}): Record<string, unknown> {
  return {
    ...input.suggestion.attributes,
    _aiProvider: input.provider ?? 'unknown',
    _aiConfidence: input.suggestion.confidence ?? null,
    _aiReviewStatus: 'pending',
    _aiImportedAt: input.importedAt,
  };
}

function toAnnotationRecord(input: {
  inspectionId: string;
  provider?: string;
  importedAt: string;
  suggestion: AiAnnotationSuggestion;
}): ImageAnnotationRecord {
  const suggestionId = input.suggestion.id ?? nanoid();
  const rawAnnotation = withSuggestionId(input.suggestion.rawAnnotation, suggestionId);

  return createImageAnnotationRecord({
    photoId: input.suggestion.photoId,
    inspectionId: input.inspectionId,
    type: input.suggestion.type,
    label: input.suggestion.label,
    rawAnnotation,
    attributes: buildSuggestionAttributes({
      suggestion: input.suggestion,
      provider: input.provider,
      importedAt: input.importedAt,
    }),
    source: 'ai',
    comment: buildSuggestionComment({
      suggestion: input.suggestion,
      provider: input.provider,
    }),
  });
}

function validateNoDemoPlaceholders(suggestionsPackage: AiSuggestionsPackage): void {
  const placeholderValues = [
    'inspection-demo-id',
    'photo-demo-id',
    'ТУТ_РЕАЛЬНЫЙ_INSPECTION_ID',
    'ТУТ_РЕАЛЬНЫЙ_PHOTO_ID',
  ];

  if (placeholderValues.includes(suggestionsPackage.inspectionId)) {
    throw new Error(
      'AI suggestions JSON still contains demo inspectionId. Use Generate & import demo, or replace inspectionId with a real local inspection id.',
    );
  }

  const invalidPhoto = suggestionsPackage.suggestions.find((suggestion) =>
    placeholderValues.includes(suggestion.photoId),
  );

  if (invalidPhoto) {
    throw new Error(
      'AI suggestions JSON still contains demo photoId. Use Generate & import demo, or replace photoId with a real local photo id.',
    );
  }
}

function validatePhotoReferences(input: {
  suggestionsPackage: AiSuggestionsPackage;
  existingPhotoIds: Set<string>;
}): void {
  const missingPhotoIds = Array.from(
    new Set(
      input.suggestionsPackage.suggestions
        .map((suggestion) => suggestion.photoId)
        .filter((photoId) => !input.existingPhotoIds.has(photoId)),
    ),
  );

  if (missingPhotoIds.length > 0) {
    throw new Error(
      `AI suggestions reference missing photo ids: ${missingPhotoIds.join(', ')}`,
    );
  }
}

export async function importAiSuggestionsData(
  value: unknown,
): Promise<ImportAiSuggestionsResult> {
  const parsedPackage = aiSuggestionsPackageSchema.parse(value);

  validateNoDemoPlaceholders(parsedPackage);

  const inspection = await db.inspections.get(parsedPackage.inspectionId);

  if (!inspection) {
    throw new Error(`Inspection not found: ${parsedPackage.inspectionId}`);
  }

  const photos = await db.photos
    .where('inspectionId')
    .equals(parsedPackage.inspectionId)
    .toArray();

  const existingPhotoIds = new Set(photos.map((photo) => photo.id));

  validatePhotoReferences({
    suggestionsPackage: parsedPackage,
    existingPhotoIds,
  });

  const importedAt = new Date().toISOString();

  const annotationRecords = parsedPackage.suggestions.map((suggestion) =>
    toAnnotationRecord({
      inspectionId: parsedPackage.inspectionId,
      provider: parsedPackage.provider,
      importedAt,
      suggestion,
    }),
  );

  const existingAnnotations = await db.annotations.bulkGet(
    annotationRecords.map((annotation) => annotation.id),
  );

  const existingAnnotationIds = new Set(
    existingAnnotations
      .filter(Boolean)
      .map((annotation) => annotation?.id)
      .filter((id): id is string => Boolean(id)),
  );

  const newAnnotationRecords = annotationRecords.filter(
    (annotation) => !existingAnnotationIds.has(annotation.id),
  );

  await db.transaction('rw', db.annotations, async () => {
    if (newAnnotationRecords.length > 0) {
      await db.annotations.bulkPut(newAnnotationRecords);
    }
  });

  const affectedPhotoIds = Array.from(
    new Set(newAnnotationRecords.map((annotation) => annotation.photoId)),
  );

  return {
    inspectionId: parsedPackage.inspectionId,
    provider: parsedPackage.provider,
    importedAt,
    suggestionsTotal: parsedPackage.suggestions.length,
    annotationsImported: newAnnotationRecords.length,
    skippedDuplicates: annotationRecords.length - newAnnotationRecords.length,
    affectedPhotoIds,
    firstPhotoId: affectedPhotoIds[0] ?? parsedPackage.suggestions[0]?.photoId,
    reportSummary: parsedPackage.report?.summary,
    warnings: parsedPackage.report?.warnings ?? [],
  };
}

export async function importAiSuggestionsFile(
  file: File,
): Promise<ImportAiSuggestionsResult> {
  return importAiSuggestionsData(await readJsonFile(file));
}
