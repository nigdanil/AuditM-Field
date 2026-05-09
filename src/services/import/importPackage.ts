import JSZip from 'jszip';
import { z } from 'zod';

import { auditConfigSchema } from '../../core/config/config.schema';
import type { AuditConfig } from '../../core/config/types';
import { imageAnnotationRecordSchema } from '../../entities/annotation/schemas';
import type { ImageAnnotationRecord } from '../../entities/annotation/types';
import { inspectionSchema } from '../../entities/inspection/schemas';
import type { Inspection } from '../../entities/inspection/types';
import { photoRecordMetadataSchema } from '../../entities/photo/schemas';
import type { PhotoRecord } from '../../entities/photo/types';
import { db } from '../db/db';
import type { ExportManifest } from '../export/exportPackage';

type ImportPhotoMetadata = Omit<PhotoRecord, 'blob'>;

export type ImportInspectionPackageResult = {
  inspection: Inspection;
  config: AuditConfig | null;
  photosImported: number;
  annotationsImported: number;
  configIncluded: boolean;
  importedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function readJsonFile<T>(zip: JSZip, path: string): Promise<T> {
  const file = zip.file(path);

  if (!file) {
    throw new Error(`Required file not found in package: ${path}`);
  }

  try {
    return JSON.parse(await file.async('text')) as T;
  } catch {
    throw new Error(`Invalid JSON file in package: ${path}`);
  }
}

function parseManifest(value: unknown): ExportManifest {
  if (!isRecord(value)) {
    throw new Error('manifest.json must be an object.');
  }

  const files = value.files;

  if (!isRecord(files)) {
    throw new Error('manifest.json does not contain files section.');
  }

  if (typeof files.inspection !== 'string') {
    throw new Error('manifest.json does not contain files.inspection path.');
  }

  if (typeof files.photosMetadata !== 'string') {
    throw new Error('manifest.json does not contain files.photosMetadata path.');
  }

  if (typeof files.annotations !== 'string') {
    throw new Error('manifest.json does not contain files.annotations path.');
  }

  if (!Array.isArray(files.photos)) {
    throw new Error('manifest.json does not contain files.photos list.');
  }

  return value as ExportManifest;
}

function findPhotoBlobPath(input: {
  manifest: ExportManifest;
  photo: ImportPhotoMetadata;
}): string {
  const photoPath = input.manifest.files.photos.find((path) =>
    path.startsWith(`photos/${input.photo.id}_`),
  );

  if (!photoPath) {
    throw new Error(`Photo blob not found in manifest for photo id: ${input.photo.id}`);
  }

  return photoPath;
}

async function buildPhotoRecords(input: {
  zip: JSZip;
  manifest: ExportManifest;
  photoMetadata: ImportPhotoMetadata[];
}): Promise<PhotoRecord[]> {
  return Promise.all(
    input.photoMetadata.map(async (photo) => {
      const photoBlobPath = findPhotoBlobPath({
        manifest: input.manifest,
        photo,
      });

      const photoFile = input.zip.file(photoBlobPath);

      if (!photoFile) {
        throw new Error(`Photo blob file not found in package: ${photoBlobPath}`);
      }

      const blob = await photoFile.async('blob');

      return {
        ...photo,
        attributes: photo.attributes ?? {},
        blob,
      };
    }),
  );
}

function validatePackageConsistency(input: {
  manifest: ExportManifest;
  inspection: Inspection;
  config: AuditConfig | null;
  photoMetadata: ImportPhotoMetadata[];
  annotations: ImageAnnotationRecord[];
}): void {
  if (input.manifest.inspection.id !== input.inspection.id) {
    throw new Error('Package consistency error: manifest inspection id differs from inspection.json.');
  }

  if (input.manifest.inspection.configId !== input.inspection.configId) {
    throw new Error('Package consistency error: manifest config id differs from inspection.json.');
  }

  if (input.config && input.config.id !== input.inspection.configId) {
    throw new Error('Package consistency error: config.json id differs from inspection configId.');
  }

  const photoIds = new Set(input.photoMetadata.map((photo) => photo.id));

  const invalidAnnotation = input.annotations.find(
    (annotation) => !photoIds.has(annotation.photoId),
  );

  if (invalidAnnotation) {
    throw new Error(
      `Package consistency error: annotation ${invalidAnnotation.id} references missing photo ${invalidAnnotation.photoId}.`,
    );
  }
}

export async function importInspectionPackage(
  file: File,
): Promise<ImportInspectionPackageResult> {
  const zip = await JSZip.loadAsync(file);
  const manifest = parseManifest(await readJsonFile<unknown>(zip, 'manifest.json'));

  const inspection = inspectionSchema.parse(
    await readJsonFile<unknown>(zip, manifest.files.inspection),
  );

  const photoMetadata = z.array(photoRecordMetadataSchema).parse(
    await readJsonFile<unknown>(zip, manifest.files.photosMetadata),
  );

  const annotations = z.array(imageAnnotationRecordSchema).parse(
    await readJsonFile<unknown>(zip, manifest.files.annotations),
  );

  const config = manifest.files.config
    ? auditConfigSchema.parse(await readJsonFile<unknown>(zip, manifest.files.config))
    : null;

  validatePackageConsistency({
    manifest,
    inspection,
    config,
    photoMetadata,
    annotations,
  });

  const photos = await buildPhotoRecords({
    zip,
    manifest,
    photoMetadata,
  });

  await db.transaction('rw', db.inspections, db.photos, db.annotations, async () => {
    await db.inspections.put({
      ...inspection,
      attributes: inspection.attributes ?? {},
    });

    if (photos.length > 0) {
      await db.photos.bulkPut(photos);
    }

    if (annotations.length > 0) {
      await db.annotations.bulkPut(
        annotations.map((annotation) => ({
          ...annotation,
          attributes: annotation.attributes ?? {},
        })),
      );
    }
  });

  return {
    inspection,
    config,
    photosImported: photos.length,
    annotationsImported: annotations.length,
    configIncluded: Boolean(config),
    importedAt: new Date().toISOString(),
  };
}
