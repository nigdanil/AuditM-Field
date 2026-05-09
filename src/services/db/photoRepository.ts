import { createPhotoModel } from '../../entities/photo/model';
import type { CreatePhotoInput, PhotoRecord } from '../../entities/photo/types';

import { db } from './db';

export async function createPhotoFromFile(input: CreatePhotoInput): Promise<PhotoRecord> {
  const photo = await createPhotoModel(input);

  await db.photos.add(photo);

  return photo;
}

export async function createPhotosFromFiles(input: {
  inspectionId: string;
  files: File[];
  type: string;
  comment?: string;
  attributes?: Record<string, unknown>;
}): Promise<PhotoRecord[]> {
  const photos = await Promise.all(
    input.files.map((file) =>
      createPhotoModel({
        inspectionId: input.inspectionId,
        type: input.type,
        file,
        comment: input.comment,
        attributes: input.attributes ?? {},
      }),
    ),
  );

  await db.photos.bulkAdd(photos);

  return photos;
}

export async function getPhotoById(id: string): Promise<PhotoRecord | undefined> {
  return db.photos.get(id);
}

export async function listRecentPhotos(limit = 50): Promise<PhotoRecord[]> {
  return db.photos.orderBy('createdAt').reverse().limit(limit).toArray();
}

export async function listPhotosByInspection(inspectionId: string): Promise<PhotoRecord[]> {
  return db.photos.where('inspectionId').equals(inspectionId).reverse().sortBy('createdAt');
}

export async function countPhotosByInspection(inspectionId: string): Promise<number> {
  return db.photos.where('inspectionId').equals(inspectionId).count();
}

export async function updatePhotoAttributes(input: {
  id: string;
  attributes: Record<string, unknown>;
}): Promise<PhotoRecord | undefined> {
  await db.photos.update(input.id, {
    attributes: input.attributes,
  });

  return getPhotoById(input.id);
}

export async function deletePhoto(id: string): Promise<void> {
  await db.transaction('rw', db.photos, db.annotations, async () => {
    await db.annotations.where('photoId').equals(id).delete();
    await db.photos.delete(id);
  });
}

export async function deletePhotosByInspection(inspectionId: string): Promise<void> {
  await db.transaction('rw', db.photos, db.annotations, async () => {
    await db.annotations.where('inspectionId').equals(inspectionId).delete();
    await db.photos.where('inspectionId').equals(inspectionId).delete();
  });
}
