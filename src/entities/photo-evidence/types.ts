import type { UserRole } from '../user/types';

export type NetworkStatus = 'online' | 'offline' | 'unknown';

export type PhotoEvidenceMetadata = {
  photoId: string;
  inspectionId: string;

  importedAt: string;
  uploadedAt?: string;
  serverReceivedAt?: string;

  exifCapturedAt?: string;
  deviceTimeZone?: string;

  fileName: string;
  fileSize: number;
  mimeType: string;

  width?: number;
  height?: number;

  exifGpsLat?: number;
  exifGpsLng?: number;

  contentHash?: string;
  duplicateHashDetected?: boolean;

  userId: string;
  userRole: UserRole;

  appVersion?: string;
  configVersion?: string;
  networkStatus?: NetworkStatus;

  correctionOfPhotoId?: string;
};
