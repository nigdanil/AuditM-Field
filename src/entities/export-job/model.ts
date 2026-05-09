import { nanoid } from 'nanoid';

import type {
  CreateExportJobInput,
  ExportJob,
  ExportJobAdapterId,
  ExportJobStatus,
} from './types';

export const exportJobStatusLabels: Record<ExportJobStatus, string> = {
  PENDING: 'Pending',
  UPLOADING: 'Uploading',
  SUCCESS: 'Success',
  FAILED: 'Failed',
};

export const exportJobAdapterLabels: Record<ExportJobAdapterId, string> = {
  'local-download': 'Local download',
  'http-upload': 'HTTP upload',
  webhook: 'Webhook',
};

export function createExportJobModel(input: CreateExportJobInput): ExportJob {
  const now = new Date().toISOString();

  return {
    id: nanoid(),
    inspectionId: input.inspectionId,
    inspectionTitle: input.inspectionTitle,
    adapterId: input.adapterId,
    status: 'PENDING',
    fileName: input.fileName,
    packageSize: input.packageSize,
    targetUrl: input.targetUrl,
    attempts: 0,
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };
}
