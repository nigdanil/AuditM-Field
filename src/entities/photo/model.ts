import { nanoid } from 'nanoid';

import { createPhotoInputSchema } from './schemas';
import type { CreatePhotoInput, PhotoRecord } from './types';
import { getEffectiveImageMimeType, isProbablyImageFile } from './fileUtils';

interface ImageDimensions {
  width?: number;
  height?: number;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

function getImageDimensions(blob: Blob): Promise<ImageDimensions> {
  if (blob instanceof File && !isProbablyImageFile(blob)) {
    return Promise.resolve({});
  }

  if (!(blob instanceof File) && blob.type && !blob.type.startsWith('image/')) {
    return Promise.resolve({});
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({});
    };

    image.src = objectUrl;
  });
}

export async function createPhotoModel(input: CreatePhotoInput): Promise<PhotoRecord> {
  const parsedInput = createPhotoInputSchema.parse({
    inspectionId: input.inspectionId,
    type: input.type,
    comment: input.comment,
    attributes: input.attributes,
  });

  const dimensions = await getImageDimensions(input.file);

  return {
    id: nanoid(),
    inspectionId: parsedInput.inspectionId,
    type: parsedInput.type,
    blob: input.file,
    fileName: input.file.name || `photo_${Date.now()}`,
    mimeType: getEffectiveImageMimeType(input.file),
    size: input.file.size,
    width: dimensions.width,
    height: dimensions.height,
    attributes: parsedInput.attributes ?? {},
    createdAt: new Date().toISOString(),
    comment: normalizeOptionalText(parsedInput.comment),
  };
}
