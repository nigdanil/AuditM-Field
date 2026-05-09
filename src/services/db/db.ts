import Dexie, { type Table } from 'dexie';

import type { ImageAnnotationRecord } from '../../entities/annotation/types';
import type { Inspection } from '../../entities/inspection/types';
import type { PhotoRecord } from '../../entities/photo/types';

export class AuditMFieldDatabase extends Dexie {
  inspections!: Table<Inspection, string>;

  photos!: Table<PhotoRecord, string>;

  annotations!: Table<ImageAnnotationRecord, string>;

  constructor() {
    super('auditm-field-db');

    this.version(1).stores({
      inspections: 'id, configId, configName, status, createdAt, updatedAt',
    });

    this.version(2).stores({
      inspections: 'id, configId, configName, status, createdAt, updatedAt',
      photos: 'id, inspectionId, type, createdAt',
    });

    this.version(3).stores({
      inspections: 'id, configId, configName, status, createdAt, updatedAt',
      photos: 'id, inspectionId, type, createdAt',
      annotations: 'id, photoId, inspectionId, type, source, createdAt, updatedAt',
    });
  }
}

export const db = new AuditMFieldDatabase();
