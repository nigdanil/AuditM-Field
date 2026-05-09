import type { ExportJobAdapterId } from '../../entities/export-job/types';

import { HttpUploadAdapter } from './adapters/HttpUploadAdapter';
import { LocalDownloadAdapter } from './adapters/LocalDownloadAdapter';
import { WebhookAdapter } from './adapters/WebhookAdapter';
import type { StorageAdapter } from './storageAdapter';

const storageAdapters: StorageAdapter[] = [
  LocalDownloadAdapter,
  HttpUploadAdapter,
  WebhookAdapter,
];

export function listStorageAdapters(): StorageAdapter[] {
  return storageAdapters;
}

export function getStorageAdapter(adapterId: ExportJobAdapterId): StorageAdapter {
  const adapter = storageAdapters.find((candidate) => candidate.id === adapterId);

  if (!adapter) {
    throw new Error(`Unknown storage adapter: ${adapterId}`);
  }

  return adapter;
}
