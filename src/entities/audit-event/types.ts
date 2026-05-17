import type { UserRole } from '../user/types';

export type AuditEventEntityType =
  | 'session'
  | 'inspection'
  | 'photo'
  | 'annotation'
  | 'review'
  | 'correction';

export type AuditEventAction =
  | 'login'
  | 'logout'
  | 'inspection_created'
  | 'inspection_submitted'
  | 'photo_added'
  | 'photo_submitted'
  | 'annotation_created'
  | 'annotation_reviewed'
  | 'review_started'
  | 'correction_requested'
  | 'correction_uploaded'
  | 'inspection_approved'
  | 'inspection_rejected';

export type AuditEvent = {
  id: string;
  entityType: AuditEventEntityType;
  entityId: string;
  action: AuditEventAction;

  userId: string;
  userRole: UserRole;
  timestamp: string;

  metadata?: Record<string, unknown>;
};
