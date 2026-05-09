import type { ExportJobAdapterId } from '../../entities/export-job/types';

import type { StorageAdapterSettings } from './settings/storageAdapterSettings';

export type UploadPackageInput = {
  file: Blob;
  fileName: string;
  metadata: Record<string, unknown>;
  settings: StorageAdapterSettings;
};

export type UploadPackageResult = {
  ok: boolean;
  status?: number;
  responseText?: string;
  url?: string;
};

export interface StorageAdapter {
  id: ExportJobAdapterId;
  name: string;
  description: string;

  isConfigured(settings: StorageAdapterSettings): boolean;

  testConnection?(settings: StorageAdapterSettings): Promise<UploadPackageResult>;

  uploadPackage(input: UploadPackageInput): Promise<UploadPackageResult>;
}
