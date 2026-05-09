import { nanoid } from 'nanoid';

import { createPhotoInputSchema } from './schemas';
import type { CreatePhotoInput, PhotoRecord } from './types';

interface ImageDimensions {
  width?: number;
  height?: number;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

function getImageDimensions(blob: Blob): Promise<ImageDimensions> {
  if (!blob.type.startsWith('image/')) {
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
  });

  const dimensions = await getImageDimensions(input.file);

  return {
    id: nanoid(),
    inspectionId: parsedInput.inspectionId,
    type: parsedInput.type,
    blob: input.file,
    fileName: input.file.name,
    mimeType: input.file.type || 'application/octet-stream',
    size: input.file.size,
    width: dimensions.width,
    height: dimensions.height,
    createdAt: new Date().toISOString(),
    comment: normalizeOptionalText(parsedInput.comment),
  };
}
