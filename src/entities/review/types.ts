import type { UserRole } from '../user/types';

export type InspectionReviewStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'needs_correction'
  | 'corrected'
  | 'approved'
  | 'rejected';

export type PhotoReviewStatus =
  | 'draft'
  | 'submitted'
  | 'reviewed_ok'
  | 'reviewed_with_issues'
  | 'correction_required'
  | 'corrected'
  | 'accepted';

export type ReviewSource = 'merchandiser' | 'supervisor' | 'ai' | 'imported';

export type PhotoCorrectionStatus = 'requested' | 'uploaded' | 'accepted' | 'rejected';

export type PhotoCorrectionLink = {
  id: string;
  inspectionId: string;
  originalPhotoId: string;
  correctionPhotoId?: string;

  requestedByUserId: string;
  requestedByRole: UserRole;
  requestedAt: string;
  reason: string;

  correctedByUserId?: string;
  correctedByRole?: UserRole;
  correctedAt?: string;

  status: PhotoCorrectionStatus;
};

export type ReviewDecision = {
  id: string;
  inspectionId: string;
  photoId?: string;
  status: InspectionReviewStatus | PhotoReviewStatus;
  comment?: string;
  decidedByUserId: string;
  decidedByRole: UserRole;
  decidedAt: string;
};
