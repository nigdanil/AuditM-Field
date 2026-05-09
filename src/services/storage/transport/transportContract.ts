import type { ExportJobAdapterId } from '../../../entities/export-job/types';
import type { ExportManifest } from '../../export/exportPackage';

export type TransportPayloadMetadata = {
  contractVersion: '1.0.0';
  packageFormatVersion: string;
  adapterId: ExportJobAdapterId;
  fileName: string;
  fileSize: number;
  inspectionId: string;
  inspectionTitle: string;
  configId: string;
  configName: string;
  exportedAt: string;
  manifest: ExportManifest;
};

export type TransportResult = {
  accepted: boolean;
  jobId?: string;
  message?: string;
  externalUrl?: string;
  status?: string;
  raw?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function buildTransportPayloadMetadata(input: {
  adapterId: ExportJobAdapterId;
  fileName: string;
  fileSize: number;
  manifest: ExportManifest;
}): TransportPayloadMetadata {
  return {
    contractVersion: '1.0.0',
    packageFormatVersion: input.manifest.app.packageFormatVersion,
    adapterId: input.adapterId,
    fileName: input.fileName,
    fileSize: input.fileSize,
    inspectionId: input.manifest.inspection.id,
    inspectionTitle: input.manifest.inspection.title,
    configId: input.manifest.inspection.configId,
    configName: input.manifest.inspection.configName,
    exportedAt: input.manifest.app.exportedAt,
    manifest: input.manifest,
  };
}

export function parseTransportResult(input: {
  responseText: string;
  fallbackMessage: string;
}): TransportResult {
  const trimmedText = input.responseText.trim();

  if (!trimmedText) {
    return {
      accepted: true,
      message: input.fallbackMessage,
    };
  }

  try {
    const parsed = JSON.parse(trimmedText) as unknown;

    if (!isRecord(parsed)) {
      return {
        accepted: true,
        message: input.fallbackMessage,
        raw: parsed,
      };
    }

    return {
      accepted: optionalBoolean(parsed.accepted) ?? true,
      jobId: optionalString(parsed.jobId),
      message: optionalString(parsed.message) ?? input.fallbackMessage,
      externalUrl: optionalString(parsed.externalUrl),
      status: optionalString(parsed.status),
      raw: parsed,
    };
  } catch {
    return {
      accepted: true,
      message: trimmedText.slice(0, 4000),
      raw: trimmedText,
    };
  }
}

export function getTransportFormFields(metadata: TransportPayloadMetadata): Record<string, string> {
  return {
    contractVersion: metadata.contractVersion,
    packageFormatVersion: metadata.packageFormatVersion,
    inspectionId: metadata.inspectionId,
    inspectionTitle: metadata.inspectionTitle,
    configId: metadata.configId,
    configName: metadata.configName,
    adapterId: metadata.adapterId,
    fileName: metadata.fileName,
    fileSize: String(metadata.fileSize),
    exportedAt: metadata.exportedAt,
  };
}
