import { nanoid } from 'nanoid';

import type { CreateInspectionInput, Inspection, InspectionStatus } from './types';

export const inspectionStatusLabels: Record<InspectionStatus, string> = {
  DRAFT: 'Draft',
  READY: 'Ready',
  EXPORTED: 'Exported',
  SYNC_PENDING: 'Sync pending',
  SYNCED: 'Synced',
  SYNC_FAILED: 'Sync failed',
  ARCHIVED: 'Archived',
};

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

export function createInspectionModel(input: CreateInspectionInput): Inspection {
  const now = new Date().toISOString();

  return {
    id: nanoid(),
    configId: input.configId,
    configName: input.configName,
    title: input.title.trim(),
    locationName: normalizeOptionalText(input.locationName),
    address: normalizeOptionalText(input.address),
    comment: normalizeOptionalText(input.comment),
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
  };
}
