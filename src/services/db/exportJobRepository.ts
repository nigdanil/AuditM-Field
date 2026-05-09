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
  const parsedInput = updateExportJobInputSchema.parse(input);

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
