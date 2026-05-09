import Dexie, { type Table } from 'dexie';

import type { Inspection } from '../../entities/inspection/types';

export class AuditMFieldDatabase extends Dexie {
  inspections!: Table<Inspection, string>;

  constructor() {
    super('auditm-field-db');

    this.version(1).stores({
      inspections: 'id, configId, configName, status, createdAt, updatedAt',
    });
  }
}

export const db = new AuditMFieldDatabase();
