import {
  createImageAnnotationRecord,
  ensureAnnotoriousAnnotationId,
  getAnnotoriousAnnotationId,
} from '../../entities/annotation/model';
import type { ImageAnnotationRecord } from '../../entities/annotation/types';

import { db } from './db';

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
    source: 'human',
  });

  await db.annotations.add(annotation);

  return annotation;
}

export async function updateAnnotationRawPayload(input: {
  rawAnnotation: unknown;
}): Promise<ImageAnnotationRecord | undefined> {
  const annotationId = getAnnotoriousAnnotationId(input.rawAnnotation);

  if (!annotationId) {
    return undefined;
  }

  const existingAnnotation = await db.annotations.get(annotationId);

  if (!existingAnnotation) {
    return undefined;
  }

  const updatedAnnotation: ImageAnnotationRecord = {
    ...existingAnnotation,
    rawAnnotation: input.rawAnnotation,
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
