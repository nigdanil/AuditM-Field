import { nanoid } from 'nanoid';

import { createImageAnnotationInputSchema } from './schemas';
import type { CreateImageAnnotationInput, ImageAnnotationRecord } from './types';

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

export function getAnnotoriousAnnotationId(rawAnnotation: unknown): string | null {
  if (!rawAnnotation || typeof rawAnnotation !== 'object') {
    return null;
  }

  const candidate = (rawAnnotation as { id?: unknown }).id;

  return typeof candidate === 'string' && candidate.trim() ? candidate : null;
}

export function ensureAnnotoriousAnnotationId(rawAnnotation: unknown): {
  id: string;
  rawAnnotation: unknown;
} {
  const existingId = getAnnotoriousAnnotationId(rawAnnotation);

  if (existingId) {
    return {
      id: existingId,
      rawAnnotation,
    };
  }

  const generatedId = nanoid();

  if (rawAnnotation && typeof rawAnnotation === 'object') {
    return {
      id: generatedId,
      rawAnnotation: {
        ...(rawAnnotation as Record<string, unknown>),
        id: generatedId,
      },
    };
  }

  return {
    id: generatedId,
    rawAnnotation: {
      id: generatedId,
      value: rawAnnotation,
    },
  };
}

export function createImageAnnotationRecord(
  input: CreateImageAnnotationInput,
): ImageAnnotationRecord {
  const parsedInput = createImageAnnotationInputSchema.parse(input);
  const { id, rawAnnotation } = ensureAnnotoriousAnnotationId(parsedInput.rawAnnotation);
  const now = new Date().toISOString();

  return {
    id,
    photoId: parsedInput.photoId,
    inspectionId: parsedInput.inspectionId,
    type: parsedInput.type,
    label: parsedInput.label,
    source: parsedInput.source,
    rawAnnotation,
    createdAt: now,
    updatedAt: now,
    comment: normalizeOptionalText(parsedInput.comment),
  };
}
