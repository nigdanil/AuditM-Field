const imageFileExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'bmp',
  'tif',
  'tiff',
  'avif',
  'heic',
  'heif',
]);

const mimeTypeByExtension: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
};

export function getFileExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const lastDotIndex = normalized.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return '';
  }

  return normalized.slice(lastDotIndex + 1);
}

export function isProbablyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) {
    return true;
  }

  const extension = getFileExtension(file.name);

  return imageFileExtensions.has(extension);
}

export function getEffectiveImageMimeType(file: File): string {
  if (file.type) {
    return file.type;
  }

  const extension = getFileExtension(file.name);

  return mimeTypeByExtension[extension] ?? 'application/octet-stream';
}

export function getFileDebugLabel(file: File): string {
  return `${file.name || 'unnamed file'} (${file.type || 'no MIME'}, ${file.size} bytes)`;
}
