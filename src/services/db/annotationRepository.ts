import {
  createImageAnnotationRecord,
  ensureAnnotoriousAnnotationId,
  getAnnotoriousAnnotationId,
} from '../../entities/annotation/model';
import type { ImageAnnotationRecord } from '../../entities/annotation/types';

import { db } from './db';

function attachAnnotationId(rawAnnotation: unknown, id: string): unknown {
  if (getAnnotoriousAnnotationId(rawAnnotation)) {
    return rawAnnotation;
  }

  if (rawAnnotation && typeof rawAnnotation === 'object') {
    return {
      ...(rawAnnotation as Record<string, unknown>),
      id,
    };
  }

  return { id, value: rawAnnotation };
}

export async function upsertAnnotationFromAnnotorious(input: {
  photoId: string;
  inspectionId: string;
  type: string;
  label: string;
  rawAnnotation: unknown;
}): Promise<ImageAnnotationRecord> {
  const { id, rawAnnotation } = ensureAnnotoriousAnnotationId(input.rawAnnotation);
  const existingAnnotation = await db.annotations.get(id);

  if (existingAnnotation) {
    const updatedAnnotation: ImageAnnotationRecord = {
      ...existingAnnotation,
      rawAnnotation,
      updatedAt: new Date().toISOString(),
    };

    await db.annotations.put(updatedAnnotation);

    return updatedAnnotation;
  }

  const annotation = createImageAnnotationRecord({
    photoId: input.photoId,
    inspectionId: input.inspectionId,
    type: input.type,
    label: input.label,
    rawAnnotation,
    attributes: {},
    source: 'human',
  });

  await db.annotations.add(annotation);

  return annotation;
}

export async function updateAnnotationRawPayload(input: {
  rawAnnotation: unknown;
  id?: string;
}): Promise<ImageAnnotationRecord | undefined> {
  const annotationId = getAnnotoriousAnnotationId(input.rawAnnotation) ?? input.id;

  if (!annotationId) {
    return undefined;
  }

  const existingAnnotation = await db.annotations.get(annotationId);

  if (!existingAnnotation) {
    return undefined;
  }

  const rawAnnotation = attachAnnotationId(input.rawAnnotation, annotationId);

  const updatedAnnotation: ImageAnnotationRecord = {
    ...existingAnnotation,
    rawAnnotation,
    updatedAt: new Date().toISOString(),
  };

  await db.annotations.put(updatedAnnotation);

  return updatedAnnotation;
}

export async function updateAnnotationAttributes(input: {
  id: string;
  attributes: Record<string, unknown>;
}): Promise<ImageAnnotationRecord | undefined> {
  const existingAnnotation = await db.annotations.get(input.id);

  if (!existingAnnotation) {
    return undefined;
  }

  const updatedAnnotation: ImageAnnotationRecord = {
    ...existingAnnotation,
    attributes: input.attributes,
    updatedAt: new Date().toISOString(),
  };

  await db.annotations.put(updatedAnnotation);

  return updatedAnnotation;
}

export async function listAnnotationsByPhoto(photoId: string): Promise<ImageAnnotationRecord[]> {
  return db.annotations.where('photoId').equals(photoId).reverse().sortBy('updatedAt');
}

export async function countAnnotationsByPhoto(photoId: string): Promise<number> {
  return db.annotations.where('photoId').equals(photoId).count();
}

export async function deleteAnnotationById(id: string): Promise<void> {
  await db.annotations.delete(id);
}

export async function deleteAnnotationByAnnotoriousPayload(rawAnnotation: unknown): Promise<void> {
  const annotationId = getAnnotoriousAnnotationId(rawAnnotation);

  if (!annotationId) {
    return;
  }

  await deleteAnnotationById(annotationId);
}

export async function deleteAnnotationsByPhoto(photoId: string): Promise<void> {
  await db.annotations.where('photoId').equals(photoId).delete();
}

export async function deleteAnnotationsByInspection(inspectionId: string): Promise<void> {
  await db.annotations.where('inspectionId').equals(inspectionId).delete();
}
