import JSZip from 'jszip';

import type { AuditConfig, ConfigLoadSource } from '../../core/config/types';
import type { ImageAnnotationRecord } from '../../entities/annotation/types';
import type { Inspection } from '../../entities/inspection/types';
import type { PhotoRecord } from '../../entities/photo/types';
import { db } from '../db/db';

import { buildVisualEvidenceAssets } from './visualEvidence';

type ExportPhotoMetadata = Omit<PhotoRecord, 'blob'>;

export type ExportManifest = {
  app: {
    name: 'AuditM-Field';
    packageFormatVersion: '1.1.0';
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
    renderedOverlays: number;
    annotationCrops: number;
  };
  files: {
    manifest: string;
    config?: string;
    inspection: string;
    photosMetadata: string;
    annotations: string;
    photos: string[];
    annotationsByPhoto: string[];
    renderedOverlays: string[];
    annotationCrops: string[];
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

export type BuildInspectionExportPreviewResult = {
  fileName: string;
  manifest: ExportManifest;
  photoCount: number;
  annotationCount: number;
  canExport: boolean;
  disabledReason?: string;
};

type InspectionExportData = {
  inspection: Inspection;
  photos: PhotoRecord[];
  annotations: ImageAnnotationRecord[];
  photoFilePaths: string[];
  annotationFilePaths: string[];
  manifest: ExportManifest;
  fileName: string;
};

function toJsonBlobContent(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function formatExportTimestamp(value: Date): string {
  return value.toISOString().slice(0, 19).replace('T', '_').replaceAll(':', '-');
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
  const inspectionId = sanitizePathPart(inspection.id);
  const timestamp = formatExportTimestamp(exportedAt);

  return `auditm-field_${inspectionId}_${timestamp}.zip`;
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

function getPhotoFilePath(photo: PhotoRecord): string {
  const safeFileName = sanitizePathPart(photo.fileName);

  return `photos/${photo.id}_${safeFileName}`;
}

function getAnnotationFilePath(photoId: string): string {
  return `annotations/${photoId}.annotations.json`;
}

function buildManifest(input: {
  inspection: Inspection;
  config: AuditConfig | null;
  configSource?: ConfigLoadSource;
  configLoadedAt?: string;
  photos: PhotoRecord[];
  annotations: ImageAnnotationRecord[];
  photoFilePaths: string[];
  annotationFilePaths: string[];
  overlayFilePaths?: string[];
  cropFilePaths?: string[];
  exportedAt: Date;
}): ExportManifest {
  const overlayFilePaths = input.overlayFilePaths ?? [];
  const cropFilePaths = input.cropFilePaths ?? [];

  return {
    app: {
      name: 'AuditM-Field',
      packageFormatVersion: '1.1.0',
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
      included: Boolean(input.config),
      id: input.config?.id,
      name: input.config?.name,
      version: input.config?.version,
      source: input.config ? input.configSource : undefined,
      loadedAt: input.config ? input.configLoadedAt : undefined,
    },
    counts: {
      photos: input.photos.length,
      annotations: input.annotations.length,
      renderedOverlays: overlayFilePaths.length,
      annotationCrops: cropFilePaths.length,
    },
    files: {
      manifest: 'manifest.json',
      config: input.config ? 'config.json' : undefined,
      inspection: `inspections/inspection_${input.inspection.id}.json`,
      photosMetadata: 'photos/photos.metadata.json',
      annotations: 'annotations/annotations.json',
      photos: input.photoFilePaths,
      annotationsByPhoto: input.annotationFilePaths,
      renderedOverlays: overlayFilePaths,
      annotationCrops: cropFilePaths,
    },
  };
}

async function loadInspectionExportData(
  input: BuildInspectionExportInput,
): Promise<InspectionExportData> {
  const inspection = await db.inspections.get(input.inspectionId);

  if (!inspection) {
    throw new Error('Inspection not found.');
  }

  const [photos, annotations] = await Promise.all([
    db.photos.where('inspectionId').equals(inspection.id).sortBy('createdAt'),
    db.annotations.where('inspectionId').equals(inspection.id).sortBy('createdAt'),
  ]);

  const exportedAt = new Date();
  const annotationsByPhoto = groupAnnotationsByPhoto(annotations);
  const photoFilePaths = photos.map(getPhotoFilePath);
  const annotationFilePaths = Object.keys(annotationsByPhoto).map(getAnnotationFilePath);

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

  return {
    inspection,
    photos,
    annotations,
    photoFilePaths,
    annotationFilePaths,
    manifest,
    fileName: getExportFileName(inspection, exportedAt),
  };
}

export async function buildInspectionExportPreview(
  input: BuildInspectionExportInput,
): Promise<BuildInspectionExportPreviewResult> {
  const data = await loadInspectionExportData(input);

  let disabledReason: string | undefined;

  if (!input.activeConfig) {
    disabledReason = 'Active config is not loaded.';
  } else if (input.activeConfig.id !== data.inspection.configId) {
    disabledReason = `Active config mismatch. Expected "${data.inspection.configId}".`;
  } else if (data.photos.length === 0) {
    disabledReason = 'Add at least one photo before export.';
  }

  return {
    fileName: data.fileName,
    manifest: data.manifest,
    photoCount: data.photos.length,
    annotationCount: data.annotations.length,
    canExport: !disabledReason,
    disabledReason,
  };
}

export async function buildInspectionExportPackage(
  input: BuildInspectionExportInput,
): Promise<BuildInspectionExportResult> {
  const activeConfig = input.activeConfig;
  const data = await loadInspectionExportData(input);

  if (!activeConfig) {
    throw new Error('Active config is not loaded. Load matching config before export.');
  }

  if (activeConfig.id !== data.inspection.configId) {
    throw new Error(
      `Active config mismatch. Inspection uses "${data.inspection.configId}", active config is "${activeConfig.id}".`,
    );
  }

  if (data.photos.length === 0) {
    throw new Error('Add at least one photo before export.');
  }

  const visualEvidence = await buildVisualEvidenceAssets({
    photos: data.photos,
    annotations: data.annotations,
    config: activeConfig,
  });

  const manifest = buildManifest({
    inspection: data.inspection,
    config: activeConfig,
    configSource: input.configSource,
    configLoadedAt: input.configLoadedAt,
    photos: data.photos,
    annotations: data.annotations,
    photoFilePaths: data.photoFilePaths,
    annotationFilePaths: data.annotationFilePaths,
    overlayFilePaths: visualEvidence.overlayFilePaths,
    cropFilePaths: visualEvidence.cropFilePaths,
    exportedAt: new Date(data.manifest.app.exportedAt),
  });

  const zip = new JSZip();
  const inspectionJson = {
    ...data.inspection,
    attributes: data.inspection.attributes ?? {},
  };
  const photoMetadata = data.photos.map(toPhotoMetadata);
  const annotationsByPhoto = groupAnnotationsByPhoto(data.annotations);

  const inspectionsFolder = zip.folder('inspections');
  const photosFolder = zip.folder('photos');
  const annotationsFolder = zip.folder('annotations');
  const renderedFolder = zip.folder('rendered');
  const cropsFolder = zip.folder('crops');

  if (!inspectionsFolder || !photosFolder || !annotationsFolder || !renderedFolder || !cropsFolder) {
    throw new Error('Failed to create ZIP folder structure.');
  }

  inspectionsFolder.file(
    `inspection_${data.inspection.id}.json`,
    toJsonBlobContent(inspectionJson),
  );

  photosFolder.file('photos.metadata.json', toJsonBlobContent(photoMetadata));
  annotationsFolder.file('annotations.json', toJsonBlobContent(data.annotations));
  zip.file('config.json', toJsonBlobContent(activeConfig));

  data.photos.forEach((photo) => {
    const photoPath = getPhotoFilePath(photo).replace('photos/', '');

    photosFolder.file(photoPath, photo.blob);
  });

  Object.entries(annotationsByPhoto).forEach(([photoId, photoAnnotations]) => {
    annotationsFolder.file(`${photoId}.annotations.json`, toJsonBlobContent(photoAnnotations));
  });

  visualEvidence.assets.forEach((asset) => {
    zip.file(asset.path, asset.blob);
  });

  if (visualEvidence.skippedAnnotations.length > 0) {
    zip.file(
      'rendered/visual-evidence.warnings.json',
      toJsonBlobContent({
        warnings: visualEvidence.skippedAnnotations,
      }),
    );
  }

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
    fileName: data.fileName,
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
