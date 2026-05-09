import type { CreatePhotoInputBase, PhotoRecordMetadata } from './schemas';

export interface PhotoRecord extends PhotoRecordMetadata {
  blob: Blob;
}

export interface CreatePhotoInput extends CreatePhotoInputBase {
  file: File;
}
