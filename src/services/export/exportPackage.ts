import JSZip from 'jszip';

import type { AuditConfig, ConfigLoadSource } from '../../core/config/types';
import type { ImageAnnotationRecord } from '../../entities/annotation/types';
import type { Inspection } from '../../entities/inspection/types';
import type { PhotoRecord } from '../../entities/photo/types';
import { db } from '../db/db';

type ExportPhotoMetadata = Omit<PhotoRecord, 'blob'>;

type ExportManifest = {
  app: {
    name: 'AuditM-Field';
    packageFormatVersion: '1.0.0';
    exportedAt: string;
  };
  inspection: {
    id: string;
    title: string;
    status: string;
    configId: string;
    configName: string;
  };
  config: {
    included: boolean;
    id?: string;
    name?: string;
    version?: string;
    source?: ConfigLoadSource;
    loadedAt?: string;
  };
  counts: {
    photos: number;
    annotations: number;
  };
  files: {
    manifest: string;
    config?: string;
    inspection: string;
    photosMetadata: string;
    annotations: string;
    photos: string[];
    annotationsByPhoto: string[];
  };
};

export type BuildInspectionExportInput = {
  inspectionId: string;
  activeConfig: AuditConfig | null;
  configSource?: ConfigLoadSource;
  configLoadedAt?: string;
};

export type BuildInspectionExportResult = {
  blob: Blob;
  fileName: string;
  manifest: ExportManifest;
};

function toJsonBlobContent(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function formatExportTimestamp(value: Date): string {
  return value.toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

function sanitizePathPart(value: string): string {
  const normalized = value.trim().toLowerCase();

  return (
    normalized
      .replaceAll('\\', '-')
      .replaceAll('/', '-')
      .replace(/[^a-z0-9а-яё._-]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}

function getExportFileName(inspection: Inspection, exportedAt: Date): string {
  const title = sanitizePathPart(inspection.title);
  const timestamp = formatExportTimestamp(exportedAt);

  return `AuditM-Field_export_${title}_${timestamp}.zip`;
}

function toPhotoMetadata(photo: PhotoRecord): ExportPhotoMetadata {
  return {
    id: photo.id,
    inspectionId: photo.inspectionId,
    type: photo.type,
    fileName: photo.fileName,
    mimeType: photo.mimeType,
    size: photo.size,
    width: photo.width,
    height: photo.height,
    attributes: photo.attributes ?? {},
    createdAt: photo.createdAt,
    comment: photo.comment,
  };
}

function groupAnnotationsByPhoto(
  annotations: ImageAnnotationRecord[],
): Record<string, ImageAnnotationRecord[]> {
  return annotations.reduce<Record<string, ImageAnnotationRecord[]>>((acc, annotation) => {
    acc[annotation.photoId] = acc[annotation.photoId] ?? [];
    acc[annotation.photoId].push(annotation);

    return acc;
  }, {});
}

function buildManifest(input: {
  inspection: Inspection;
  config: AuditConfig;
  configSource?: ConfigLoadSource;
  configLoadedAt?: string;
  photos: PhotoRecord[];
  annotations: ImageAnnotationRecord[];
  photoFilePaths: string[];
  annotationFilePaths: string[];
  exportedAt: Date;
}): ExportManifest {
  return {
    app: {
      name: 'AuditM-Field',
      packageFormatVersion: '1.0.0',
      exportedAt: input.exportedAt.toISOString(),
    },
    inspection: {
      id: input.inspection.id,
      title: input.inspection.title,
      status: input.inspection.status,
      configId: input.inspection.configId,
      configName: input.inspection.configName,
    },
    config: {
      included: true,
      id: input.config.id,
      name: input.config.name,
      version: input.config.version,
      source: input.configSource,
      loadedAt: input.configLoadedAt,
    },
    counts: {
      photos: input.photos.length,
      annotations: input.annotations.length,
    },
    files: {
      manifest: 'manifest.json',
      config: 'config.json',
      inspection: `inspections/inspection_${input.inspection.id}.json`,
      photosMetadata: 'photos/photos.metadata.json',
      annotations: 'annotations/annotations.json',
      photos: input.photoFilePaths,
      annotationsByPhoto: input.annotationFilePaths,
    },
  };
}

export async function buildInspectionExportPackage(
  input: BuildInspectionExportInput,
): Promise<BuildInspectionExportResult> {
  const inspection = await db.inspections.get(input.inspectionId);

  if (!inspection) {
    throw new Error('Inspection not found.');
  }

  if (!input.activeConfig) {
    throw new Error('Active config is not loaded. Load matching config before export.');
  }

  if (input.activeConfig.id !== inspection.configId) {
    throw new Error(
      `Active config mismatch. Inspection uses "${inspection.configId}", active config is "${input.activeConfig.id}".`,
    );
  }

  const [photos, annotations] = await Promise.all([
    db.photos.where('inspectionId').equals(inspection.id).sortBy('createdAt'),
    db.annotations.where('inspectionId').equals(inspection.id).sortBy('createdAt'),
  ]);

  const exportedAt = new Date();
  const zip = new JSZip();

  const inspectionJson = {
    ...inspection,
    attributes: inspection.attributes ?? {},
  };

  const photoMetadata = photos.map(toPhotoMetadata);
  const annotationsByPhoto = groupAnnotationsByPhoto(annotations);

  const inspectionsFolder = zip.folder('inspections');
  const photosFolder = zip.folder('photos');
  const annotationsFolder = zip.folder('annotations');

  if (!inspectionsFolder || !photosFolder || !annotationsFolder) {
    throw new Error('Failed to create ZIP folder structure.');
  }

  inspectionsFolder.file(
    `inspection_${inspection.id}.json`,
    toJsonBlobContent(inspectionJson),
  );

  photosFolder.file('photos.metadata.json', toJsonBlobContent(photoMetadata));
  annotationsFolder.file('annotations.json', toJsonBlobContent(annotations));
  zip.file('config.json', toJsonBlobContent(input.activeConfig));

  const photoFilePaths = photos.map((photo) => {
    const safeFileName = sanitizePathPart(photo.fileName);
    const photoPath = `photos/${photo.id}_${safeFileName}`;

    photosFolder.file(`${photo.id}_${safeFileName}`, photo.blob);

    return photoPath;
  });

  const annotationFilePaths = Object.entries(annotationsByPhoto).map(
    ([photoId, photoAnnotations]) => {
      const fileName = `${photoId}.annotations.json`;
      const annotationPath = `annotations/${fileName}`;

      annotationsFolder.file(fileName, toJsonBlobContent(photoAnnotations));

      return annotationPath;
    },
  );

  const manifest = buildManifest({
    inspection,
    config: input.activeConfig,
    configSource: input.configSource,
    configLoadedAt: input.configLoadedAt,
    photos,
    annotations,
    photoFilePaths,
    annotationFilePaths,
    exportedAt,
  });

  zip.file('manifest.json', toJsonBlobContent(manifest));

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });

  return {
    blob,
    manifest,
    fileName: getExportFileName(inspection, exportedAt),
  };
}

export function downloadBlob(input: { blob: Blob; fileName: string }): void {
  const objectUrl = URL.createObjectURL(input.blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = input.fileName;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}
