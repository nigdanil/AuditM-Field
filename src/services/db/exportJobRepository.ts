import { createExportJobModel } from '../../entities/export-job/model';
import {
  createExportJobInputSchema,
  updateExportJobInputSchema,
} from '../../entities/export-job/schemas';
import type {
  CreateExportJobInput,
  ExportJob,
  UpdateExportJobInput,
} from '../../entities/export-job/types';

import { db } from './db';

const MAX_TEXT_LENGTH = 4000;

function limitText(value: string | undefined): string | undefined {
  if (!value) {
    return value;
  }

  if (value.length <= MAX_TEXT_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_TEXT_LENGTH)}\n\n[truncated to ${MAX_TEXT_LENGTH} chars]`;
}

function normalizeUpdateInput(input: UpdateExportJobInput): UpdateExportJobInput {
  return {
    ...input,
    responseText: limitText(input.responseText),
    errorMessage: limitText(input.errorMessage),
  };
}

export async function createExportJob(input: CreateExportJobInput): Promise<ExportJob> {
  const parsedInput = createExportJobInputSchema.parse(input);
  const job = createExportJobModel(parsedInput);

  await db.exportJobs.add(job);

  return job;
}

export async function getExportJobById(id: string): Promise<ExportJob | undefined> {
  return db.exportJobs.get(id);
}

export async function listExportJobs(): Promise<ExportJob[]> {
  return db.exportJobs.orderBy('updatedAt').reverse().toArray();
}

export async function updateExportJob(
  id: string,
  input: UpdateExportJobInput,
): Promise<ExportJob | undefined> {
  const parsedInput = updateExportJobInputSchema.parse(normalizeUpdateInput(input));

  await db.exportJobs.update(id, {
    ...parsedInput,
    updatedAt: new Date().toISOString(),
  });

  return getExportJobById(id);
}

export async function deleteExportJob(id: string): Promise<void> {
  await db.exportJobs.delete(id);
}

export async function clearExportJobs(): Promise<void> {
  await db.exportJobs.clear();
}
