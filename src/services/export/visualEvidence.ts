import type { AuditConfig } from '../../core/config/types';
import type { ImageAnnotationRecord } from '../../entities/annotation/types';
import type { PhotoRecord } from '../../entities/photo/types';

type AnnotationBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ResolvedAnnotationBounds = {
  annotation: ImageAnnotationRecord;
  bounds: AnnotationBounds;
};

export type VisualEvidenceAsset = {
  kind: 'overlay' | 'crop';
  photoId: string;
  annotationId?: string;
  path: string;
  blob: Blob;
};

export type VisualEvidenceResult = {
  assets: VisualEvidenceAsset[];
  overlayFilePaths: string[];
  cropFilePaths: string[];
  skippedAnnotations: Array<{
    id: string;
    photoId: string;
    reason: string;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function sanitizePathPart(value: string): string {
  const normalized = value.trim().toLowerCase();

  return (
    normalized
      .replaceAll('\\', '-')
      .replaceAll('/', '-')
      .replace(/[^a-z0-9а-яё._-]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeBounds(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  unit?: 'pixel' | 'percent' | 'ratio';
}): AnnotationBounds | null {
  let { x, y, width, height } = input;

  if (input.unit === 'percent') {
    x = (x / 100) * input.imageWidth;
    y = (y / 100) * input.imageHeight;
    width = (width / 100) * input.imageWidth;
    height = (height / 100) * input.imageHeight;
  }

  if (input.unit === 'ratio') {
    x *= input.imageWidth;
    y *= input.imageHeight;
    width *= input.imageWidth;
    height *= input.imageHeight;
  }

  if (![x, y, width, height].every(Number.isFinite)) {
    return null;
  }

  if (width <= 0 || height <= 0) {
    return null;
  }

  const left = clamp(x, 0, input.imageWidth);
  const top = clamp(y, 0, input.imageHeight);
  const right = clamp(x + width, 0, input.imageWidth);
  const bottom = clamp(y + height, 0, input.imageHeight);

  const normalizedWidth = right - left;
  const normalizedHeight = bottom - top;

  if (normalizedWidth <= 1 || normalizedHeight <= 1) {
    return null;
  }

  return {
    x: left,
    y: top,
    width: normalizedWidth,
    height: normalizedHeight,
  };
}

function parseFragmentSelector(input: {
  value: string;
  imageWidth: number;
  imageHeight: number;
}): AnnotationBounds | null {
  const match = input.value.match(
    /xywh=(?:(pixel|percent):)?([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/i,
  );

  if (!match) {
    return null;
  }

  const unit = match[1]?.toLowerCase() === 'percent' ? 'percent' : 'pixel';
  const [, , x, y, width, height] = match;

  return normalizeBounds({
    x: Number(x),
    y: Number(y),
    width: Number(width),
    height: Number(height),
    imageWidth: input.imageWidth,
    imageHeight: input.imageHeight,
    unit,
  });
}

function readSvgAttr(rect: string, name: string): number | null {
  const match = rect.match(new RegExp(`${name}=["']?([+-]?\\d+(?:\\.\\d+)?)["']?`, 'i'));

  return match ? Number(match[1]) : null;
}

function parseSvgSelector(input: {
  value: string;
  imageWidth: number;
  imageHeight: number;
}): AnnotationBounds | null {
  const rectMatch = input.value.match(/<rect\b[^>]*>/i);

  if (!rectMatch) {
    return null;
  }

  const rect = rectMatch[0];
  const x = readSvgAttr(rect, 'x');
  const y = readSvgAttr(rect, 'y');
  const width = readSvgAttr(rect, 'width');
  const height = readSvgAttr(rect, 'height');

  if (x === null || y === null || width === null || height === null) {
    return null;
  }

  return normalizeBounds({
    x,
    y,
    width,
    height,
    imageWidth: input.imageWidth,
    imageHeight: input.imageHeight,
  });
}

function parseStringBounds(input: {
  value: string;
  imageWidth: number;
  imageHeight: number;
}): AnnotationBounds | null {
  return parseFragmentSelector(input) ?? parseSvgSelector(input);
}

function parseDirectRecordBounds(input: {
  value: Record<string, unknown>;
  imageWidth: number;
  imageHeight: number;
}): AnnotationBounds | null {
  const x =
    toNumber(input.value.x) ??
    toNumber(input.value.left) ??
    toNumber(input.value.minX) ??
    toNumber(input.value.x1);

  const y =
    toNumber(input.value.y) ??
    toNumber(input.value.top) ??
    toNumber(input.value.minY) ??
    toNumber(input.value.y1);

  let width = toNumber(input.value.width) ?? toNumber(input.value.w);
  let height = toNumber(input.value.height) ?? toNumber(input.value.h);

  const maxX = toNumber(input.value.maxX) ?? toNumber(input.value.x2);
  const maxY = toNumber(input.value.maxY) ?? toNumber(input.value.y2);

  if (width === null && x !== null && maxX !== null) {
    width = maxX - x;
  }

  if (height === null && y !== null && maxY !== null) {
    height = maxY - y;
  }

  if (x === null || y === null || width === null || height === null) {
    return null;
  }

  const looksLikeRatio =
    x >= 0 && x <= 1 && y >= 0 && y <= 1 && width > 0 && width <= 1 && height > 0 && height <= 1;

  const explicitUnit = input.value.unit ?? input.value.units;
  const unit =
    explicitUnit === 'percent'
      ? 'percent'
      : explicitUnit === 'ratio' || looksLikeRatio
        ? 'ratio'
        : 'pixel';

  return normalizeBounds({
    x,
    y,
    width,
    height,
    imageWidth: input.imageWidth,
    imageHeight: input.imageHeight,
    unit,
  });
}

function extractBoundsCandidates(input: {
  value: unknown;
  imageWidth: number;
  imageHeight: number;
  depth?: number;
}): AnnotationBounds[] {
  const depth = input.depth ?? 0;

  if (depth > 8) {
    return [];
  }

  if (typeof input.value === 'string') {
    const parsed = parseStringBounds({
      value: input.value,
      imageWidth: input.imageWidth,
      imageHeight: input.imageHeight,
    });

    return parsed ? [parsed] : [];
  }

  if (Array.isArray(input.value)) {
    return input.value.flatMap((item) =>
      extractBoundsCandidates({
        value: item,
        imageWidth: input.imageWidth,
        imageHeight: input.imageHeight,
        depth: depth + 1,
      }),
    );
  }

  if (!isRecord(input.value)) {
    return [];
  }

  const direct = parseDirectRecordBounds({
    value: input.value,
    imageWidth: input.imageWidth,
    imageHeight: input.imageHeight,
  });

  const nested = Object.values(input.value).flatMap((item) =>
    extractBoundsCandidates({
      value: item,
      imageWidth: input.imageWidth,
      imageHeight: input.imageHeight,
      depth: depth + 1,
    }),
  );

  return direct ? [direct, ...nested] : nested;
}

function getAnnotationBounds(input: {
  annotation: ImageAnnotationRecord;
  imageWidth: number;
  imageHeight: number;
}): AnnotationBounds | null {
  const candidates = extractBoundsCandidates({
    value: input.annotation.rawAnnotation,
    imageWidth: input.imageWidth,
    imageHeight: input.imageHeight,
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((a, b) => b.width * b.height - a.width * a.height)[0];
}

function getAnnotationColor(input: {
  annotation: ImageAnnotationRecord;
  config: AuditConfig;
}): string {
  const annotationType = input.config.annotationTypes.find(
    (item) => item.id === input.annotation.type,
  );

  const color = annotationType?.color;

  return typeof color === 'string' && color.trim() ? color : '#38bdf8';
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim().replace('#', '');

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return `rgba(56, 189, 248, ${alpha})`;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image blob.'));
    };

    image.src = objectUrl;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to render canvas as PNG.'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

function drawOverlayLabel(input: {
  context: CanvasRenderingContext2D;
  bounds: AnnotationBounds;
  text: string;
  color: string;
  imageWidth: number;
}) {
  const fontSize = Math.max(14, Math.round(input.imageWidth / 90));
  const paddingX = 6;
  const paddingY = 4;
  const label = input.text.slice(0, 48);

  input.context.font = `${fontSize}px sans-serif`;

  const metrics = input.context.measureText(label);
  const labelWidth = metrics.width + paddingX * 2;
  const labelHeight = fontSize + paddingY * 2;
  const labelX = input.bounds.x;
  const labelY = Math.max(0, input.bounds.y - labelHeight - 2);

  input.context.fillStyle = input.color;
  input.context.fillRect(labelX, labelY, labelWidth, labelHeight);

  input.context.fillStyle = '#020617';
  input.context.fillText(label, labelX + paddingX, labelY + fontSize + paddingY - 2);
}

async function renderOverlay(input: {
  image: HTMLImageElement;
  annotations: ResolvedAnnotationBounds[];
  config: AuditConfig;
}): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is not available.');
  }

  canvas.width = input.image.naturalWidth;
  canvas.height = input.image.naturalHeight;

  context.drawImage(input.image, 0, 0, canvas.width, canvas.height);

  input.annotations.forEach(({ annotation, bounds }) => {
    const color = getAnnotationColor({
      annotation,
      config: input.config,
    });

    context.fillStyle = hexToRgba(color, 0.16);
    context.strokeStyle = color;
    context.lineWidth = Math.max(3, Math.round(canvas.width / 400));

    context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    drawOverlayLabel({
      context,
      bounds,
      text: `${annotation.label} · ${annotation.source}`,
      color,
      imageWidth: canvas.width,
    });
  });

  return canvasToPngBlob(canvas);
}

async function renderCrop(input: {
  image: HTMLImageElement;
  bounds: AnnotationBounds;
}): Promise<Blob> {
  const padding = Math.max(8, Math.round(Math.min(input.bounds.width, input.bounds.height) * 0.05));

  const cropX = Math.floor(clamp(input.bounds.x - padding, 0, input.image.naturalWidth));
  const cropY = Math.floor(clamp(input.bounds.y - padding, 0, input.image.naturalHeight));
  const cropRight = Math.ceil(
    clamp(input.bounds.x + input.bounds.width + padding, 0, input.image.naturalWidth),
  );
  const cropBottom = Math.ceil(
    clamp(input.bounds.y + input.bounds.height + padding, 0, input.image.naturalHeight),
  );

  const cropWidth = cropRight - cropX;
  const cropHeight = cropBottom - cropY;

  if (cropWidth <= 1 || cropHeight <= 1) {
    throw new Error('Crop area is too small.');
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is not available.');
  }

  canvas.width = cropWidth;
  canvas.height = cropHeight;

  context.drawImage(
    input.image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return canvasToPngBlob(canvas);
}

function groupAnnotationsByPhoto(
  annotations: ImageAnnotationRecord[],
): Record<string, ImageAnnotationRecord[]> {
  return annotations.reduce<Record<string, ImageAnnotationRecord[]>>((acc, annotation) => {
    acc[annotation.photoId] = acc[annotation.photoId] ?? [];
    acc[annotation.photoId].push(annotation);

    return acc;
  }, {});
}

export async function buildVisualEvidenceAssets(input: {
  photos: PhotoRecord[];
  annotations: ImageAnnotationRecord[];
  config: AuditConfig;
}): Promise<VisualEvidenceResult> {
  if (typeof document === 'undefined') {
    return {
      assets: [],
      overlayFilePaths: [],
      cropFilePaths: [],
      skippedAnnotations: input.annotations.map((annotation) => ({
        id: annotation.id,
        photoId: annotation.photoId,
        reason: 'Visual evidence export requires browser canvas.',
      })),
    };
  }

  const assets: VisualEvidenceAsset[] = [];
  const skippedAnnotations: VisualEvidenceResult['skippedAnnotations'] = [];
  const annotationsByPhoto = groupAnnotationsByPhoto(input.annotations);

  for (const photo of input.photos) {
    const photoAnnotations = annotationsByPhoto[photo.id] ?? [];

    if (photoAnnotations.length === 0) {
      continue;
    }

    const image = await loadImageFromBlob(photo.blob);
    const resolvedAnnotations: ResolvedAnnotationBounds[] = [];

    photoAnnotations.forEach((annotation) => {
      const bounds = getAnnotationBounds({
        annotation,
        imageWidth: image.naturalWidth,
        imageHeight: image.naturalHeight,
      });

      if (!bounds) {
        skippedAnnotations.push({
          id: annotation.id,
          photoId: annotation.photoId,
          reason: 'Annotation geometry could not be resolved.',
        });
        return;
      }

      resolvedAnnotations.push({
        annotation,
        bounds,
      });
    });

    if (resolvedAnnotations.length === 0) {
      continue;
    }

    const safePhotoId = sanitizePathPart(photo.id);
    const overlayPath = `rendered/${safePhotoId}.overlay.png`;
    const overlayBlob = await renderOverlay({
      image,
      annotations: resolvedAnnotations,
      config: input.config,
    });

    assets.push({
      kind: 'overlay',
      photoId: photo.id,
      path: overlayPath,
      blob: overlayBlob,
    });

    for (const { annotation, bounds } of resolvedAnnotations) {
      const safeAnnotationId = sanitizePathPart(annotation.id);
      const cropPath = `crops/${safePhotoId}/${safeAnnotationId}.png`;
      const cropBlob = await renderCrop({
        image,
        bounds,
      });

      assets.push({
        kind: 'crop',
        photoId: photo.id,
        annotationId: annotation.id,
        path: cropPath,
        blob: cropBlob,
      });
    }
  }

  return {
    assets,
    overlayFilePaths: assets
      .filter((asset) => asset.kind === 'overlay')
      .map((asset) => asset.path),
    cropFilePaths: assets.filter((asset) => asset.kind === 'crop').map((asset) => asset.path),
    skippedAnnotations,
  };
}
