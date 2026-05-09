import { createInspectionModel } from '../../entities/inspection/model';
import {
  createInspectionInputSchema,
  inspectionStatusSchema,
  updateInspectionInputSchema,
} from '../../entities/inspection/schemas';
import type {
  CreateInspectionInput,
  Inspection,
  InspectionStatus,
  UpdateInspectionInput,
} from '../../entities/inspection/types';

import { db } from './db';

function normalizeCreateInspectionInput(input: CreateInspectionInput): CreateInspectionInput {
  return {
    ...input,
    title: input.title.trim(),
    locationName: input.locationName?.trim() || undefined,
    address: input.address?.trim() || undefined,
    comment: input.comment?.trim() || undefined,
    attributes: input.attributes ?? {},
  };
}

export async function createInspection(input: CreateInspectionInput): Promise<Inspection> {
  const parsedInput = createInspectionInputSchema.parse(normalizeCreateInspectionInput(input));
  const inspection = createInspectionModel(parsedInput);

  await db.inspections.add(inspection);

  return inspection;
}

export async function getInspectionById(id: string): Promise<Inspection | undefined> {
  return db.inspections.get(id);
}

export async function listInspections(): Promise<Inspection[]> {
  return db.inspections.orderBy('updatedAt').reverse().toArray();
}

export async function countInspections(): Promise<number> {
  return db.inspections.count();
}

export async function updateInspection(
  id: string,
  input: UpdateInspectionInput,
): Promise<Inspection | undefined> {
  const parsedInput = updateInspectionInputSchema.parse(input);

  const patch: Partial<Inspection> = {
    ...parsedInput,
    updatedAt: new Date().toISOString(),
  };

  if (patch.title) {
    patch.title = patch.title.trim();
  }

  await db.inspections.update(id, patch);

  return getInspectionById(id);
}

export async function updateInspectionAttributes(input: {
  id: string;
  attributes: Record<string, unknown>;
}): Promise<Inspection | undefined> {
  await db.inspections.update(input.id, {
    attributes: input.attributes,
    updatedAt: new Date().toISOString(),
  });

  return getInspectionById(input.id);
}

export async function updateInspectionStatus(
  id: string,
  status: InspectionStatus,
): Promise<Inspection | undefined> {
  const parsedStatus = inspectionStatusSchema.parse(status);

  await db.inspections.update(id, {
    status: parsedStatus,
    updatedAt: new Date().toISOString(),
  });

  return getInspectionById(id);
}

export async function deleteInspection(id: string): Promise<void> {
  await db.transaction('rw', db.inspections, db.photos, db.annotations, async () => {
    await db.annotations.where('inspectionId').equals(id).delete();
    await db.photos.where('inspectionId').equals(id).delete();
    await db.inspections.delete(id);
  });
}
