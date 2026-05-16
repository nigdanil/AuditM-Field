import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Annotorious,
  ImageAnnotator,
  UserSelectAction,
  useAnnotator,
} from '@annotorious/react';

import type {
  AnnotationState,
  Color,
  DrawingStyle,
  ImageAnnotation,
} from '@annotorious/react';

import '@annotorious/react/annotorious-react.css';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Filter,
  ImagePlus,
  Info,
  Trash2,
  XCircle,
} from 'lucide-react';

import { loadActiveConfig } from '../../core/config/configStorage';
import type { AnnotationTypeConfig } from '../../core/config/types';
import type { AnnotationSource, ImageAnnotationRecord } from '../../entities/annotation/types';
import type { PhotoRecord } from '../../entities/photo/types';
import { DynamicFieldsForm } from '../../features/fill-dynamic-form/DynamicFieldsForm';
import {
  clearPendingAiAnnotationsByPhoto,
  deleteAnnotationByAnnotoriousPayload,
  deleteAnnotationById,
  listAnnotationsByPhoto,
  updateAnnotationAttributes,
  updateAnnotationRawPayload,
  updateAnnotationReviewState,
  upsertAnnotationFromAnnotorious,
} from '../../services/db/annotationRepository';
import { getPhotoById } from '../../services/db/photoRepository';

const fallbackAnnotationType: AnnotationTypeConfig = {
  id: 'annotation',
  label: 'Annotation',
  shape: 'rectangle',
  color: '#38bdf8',
};
const fallbackAnnotationColor: Color = '#38bdf8';

type AnnotationSourceFilter = 'all' | AnnotationSource | 'pending_ai';

const annotationSourceFilterLabels: Record<AnnotationSourceFilter, string> = {
  all: 'All',
  human: 'Human',
  ai: 'AI',
  imported: 'Imported',
  pending_ai: 'Pending AI',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function stringifyRawAnnotation(rawAnnotation: unknown): string {
  try {
    return JSON.stringify(rawAnnotation) ?? '';
  } catch {
    return String(rawAnnotation);
  }
}

function getSelectedAnnotoriousAnnotation(annotator: unknown): unknown | null {
  if (!annotator || typeof annotator !== 'object') {
    return null;
  }

  const annotatorApi = annotator as { getSelected?: () => unknown };

  if (typeof annotatorApi.getSelected !== 'function') {
    return null;
  }

  const selected = annotatorApi.getSelected();

  if (Array.isArray(selected)) {
    return selected[0] ?? null;
  }

  return selected ?? null;
}

function isInternalAiAttributeKey(key: string): boolean {
  return key.startsWith('_ai');
}

function isDisplayableAttributeValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function formatAttributeKey(key: string): string {
  return key.replaceAll('_', ' ');
}

function formatAttributeValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(String).join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function getAiConfidence(annotation: ImageAnnotationRecord): number | null {
  const value = annotation.attributes?._aiConfidence;

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getAiReviewStatus(annotation: ImageAnnotationRecord): string {
  const value = annotation.attributes?._aiReviewStatus;

  return typeof value === 'string' && value.trim() ? value : 'pending';
}

function isPendingAiAnnotation(annotation: ImageAnnotationRecord): boolean {
  return annotation.source === 'ai' && getAiReviewStatus(annotation) === 'pending';
}

function isAcceptedAiAnnotation(annotation: ImageAnnotationRecord): boolean {
  return (
    annotation.source === 'human' &&
    annotation.attributes?._aiOriginalSource === 'ai' &&
    getAiReviewStatus(annotation) === 'accepted'
  );
}

function hasAiMetadata(annotation: ImageAnnotationRecord): boolean {
  return Object.keys(annotation.attributes ?? {}).some((key) => key.startsWith('_ai'));
}

function formatAiMetadataValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'not set';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function hasInvalidAnnotationGeometryValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return !Number.isFinite(value);
  }

  if (typeof value === 'string') {
    return /(^|[^a-zA-Z])(NaN|Infinity|-Infinity)([^a-zA-Z]|$)/.test(value);
  }

  if (Array.isArray(value)) {
    return value.some(hasInvalidAnnotationGeometryValue);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some(hasInvalidAnnotationGeometryValue);
  }

  return false;
}

function isRenderableRawAnnotation(rawAnnotation: unknown): boolean {
  if (!rawAnnotation || typeof rawAnnotation !== 'object') {
    return false;
  }

  return !hasInvalidAnnotationGeometryValue(rawAnnotation);
}

type RawAnnotationObject = Record<string, unknown>;

function normalizeRawAnnotationTargetForImage(target: unknown, imageSource: string): unknown {
  if (Array.isArray(target)) {
    return target.map((item) => normalizeRawAnnotationTargetForImage(item, imageSource));
  }

  if (target && typeof target === 'object') {
    return {
      ...(target as RawAnnotationObject),
      source: imageSource,
    };
  }

  return target;
}

function normalizeRawAnnotationForImage(
  rawAnnotation: unknown,
  imageSource: string,
  annotationId: string,
): unknown {
  if (!rawAnnotation || typeof rawAnnotation !== 'object') {
    return rawAnnotation;
  }

  const normalizedAnnotation: RawAnnotationObject = {
    ...(rawAnnotation as RawAnnotationObject),
    id: annotationId,
  };

  if ('target' in normalizedAnnotation) {
    normalizedAnnotation.target = normalizeRawAnnotationTargetForImage(
      normalizedAnnotation.target,
      imageSource,
    );
  }

  return normalizedAnnotation;
}

function PhotoAnnotationWorkspace({ photo }: { photo: PhotoRecord }) {
  const annotator = useAnnotator();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [activeConfigState] = useState(() => loadActiveConfig());
  const [selectedAnnotationTypeId, setSelectedAnnotationTypeId] = useState('');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [annotationSourceFilter, setAnnotationSourceFilter] =
    useState<AnnotationSourceFilter>('all');

  const annotationRecords = useLiveQuery(
    () => listAnnotationsByPhoto(photo.id),
    [photo.id],
    [],
  );
  
  const annotationRecordsRef = useRef<ImageAnnotationRecord[]>(annotationRecords);
  const selectedAnnotationIdRef = useRef<string | null>(selectedAnnotationId);
  const renderedAnnotationIdsRef = useRef<Set<string>>(new Set());
  const [visibleAnnotationTypeIds, setVisibleAnnotationTypeIds] = useState<string[]>([]);

  const annotationTypes = useMemo(() => {
    const configuredTypes = activeConfigState?.config.annotationTypes ?? [];

    return configuredTypes.length > 0 ? configuredTypes : [fallbackAnnotationType];
  }, [activeConfigState]);

  const annotationForm = activeConfigState?.config.annotationForm ?? [];
  const dictionaries = activeConfigState?.config.dictionaries ?? {};

  const rawAnnotationRevision = useMemo(() => {
    return annotationRecords
      .map((record) => `${record.id}:${stringifyRawAnnotation(record.rawAnnotation)}`)
      .join('|');
  }, [annotationRecords]);

  useEffect(() => {
    annotationRecordsRef.current = annotationRecords;
  }, [annotationRecords]);

  useEffect(() => {
    selectedAnnotationIdRef.current = selectedAnnotationId;
  }, [selectedAnnotationId]);

  useEffect(() => {
    setVisibleAnnotationTypeIds((currentVisibleTypes) => {
      const availableTypeIds = annotationTypes.map((annotationType) => annotationType.id);

      if (currentVisibleTypes.length === 0) {
        return availableTypeIds;
      }

      const nextVisibleTypes = currentVisibleTypes.filter((typeId) =>
        availableTypeIds.includes(typeId),
      );

      return nextVisibleTypes.length > 0 ? nextVisibleTypes : availableTypeIds;
    });
  }, [annotationTypes]);

  const effectiveAnnotationTypeId = selectedAnnotationTypeId || annotationTypes[0].id;
  const effectiveAnnotationType =
    annotationTypes.find((annotationType) => annotationType.id === effectiveAnnotationTypeId) ??
    annotationTypes[0];
  const annotationTypeById = useMemo(() => {
    return new Map(annotationTypes.map((annotationType) => [annotationType.id, annotationType]));
  }, [annotationTypes]);

  const annotationRecordById = useMemo(() => {
    return new Map(annotationRecords.map((annotation) => [annotation.id, annotation]));
  }, [annotationRecords]);

  const selectedAnnotation = selectedAnnotationId
    ? annotationRecordById.get(selectedAnnotationId)
    : undefined;

  const sourceCounts = useMemo(() => {
    return annotationRecords.reduce<Record<AnnotationSourceFilter, number>>(
      (acc, annotation) => {
        acc.all += 1;
        acc[annotation.source] += 1;

        if (isPendingAiAnnotation(annotation)) {
          acc.pending_ai += 1;
        }

        return acc;
      },
      {
        all: 0,
        human: 0,
        ai: 0,
        imported: 0,
        pending_ai: 0,
      },
    );
  }, [annotationRecords]);

  const pendingAiAnnotations = useMemo(() => {
    return annotationRecords.filter(isPendingAiAnnotation);
  }, [annotationRecords]);

  const visibleAnnotationRecords = useMemo(() => {
    return annotationRecords.filter((annotation) => {
      if (!visibleAnnotationTypeIds.includes(annotation.type)) {
        return false;
      }

      if (annotationSourceFilter === 'all') {
        return true;
      }

      if (annotationSourceFilter === 'pending_ai') {
        return isPendingAiAnnotation(annotation);
      }

      return annotation.source === annotationSourceFilter;
    });
  }, [annotationRecords, annotationSourceFilter, visibleAnnotationTypeIds]);

  useEffect(() => {
    if (selectedAnnotationId && !annotationRecordById.has(selectedAnnotationId)) {
      setSelectedAnnotationId(null);
    }
  }, [annotationRecordById, selectedAnnotationId]);

  useEffect(() => {
    if (
      selectedAnnotationId &&
      !visibleAnnotationRecords.some((annotation) => annotation.id === selectedAnnotationId)
    ) {
      setSelectedAnnotationId(null);
    }
  }, [selectedAnnotationId, visibleAnnotationRecords]);

  const toAnnotationColor = (color: string | undefined): Color => {
    if (color?.startsWith('#') || color?.startsWith('rgb(') || color?.startsWith('rgba(')) {
      return color as Color;
    }

    return fallbackAnnotationColor;
  };

  const getAnnotationColor = (typeId: string): Color => {
    return toAnnotationColor(annotationTypeById.get(typeId)?.color);
  };

  const getRawAnnotationId = (annotation: unknown): string | null => {
    if (typeof annotation === 'string') {
      return annotation;
    }

    if (!annotation || typeof annotation !== 'object') {
      return null;
    }

    const id = (annotation as { id?: unknown }).id;

    return typeof id === 'string' ? id : null;
  };

  const flushSelectedAnnotationGeometry = useCallback(async () => {
    if (!annotator || !objectUrl) {
      return undefined;
    }

    const selectedAnnotoriousAnnotation = getSelectedAnnotoriousAnnotation(annotator);
    const annotationId =
      getRawAnnotationId(selectedAnnotoriousAnnotation) ?? selectedAnnotationIdRef.current;

    if (!selectedAnnotoriousAnnotation || !annotationId) {
      return undefined;
    }

    if (!isRenderableRawAnnotation(selectedAnnotoriousAnnotation)) {
      return undefined;
    }

    
    const storedAnnotation = annotationRecordsRef.current.find(
      (record) => record.id === annotationId,
    );

    const storedRawAnnotationForCurrentImage = storedAnnotation
      ? normalizeRawAnnotationForImage(
          storedAnnotation.rawAnnotation,
          objectUrl,
          storedAnnotation.id,
        )
      : null;

    if (
      storedRawAnnotationForCurrentImage &&
      stringifyRawAnnotation(storedRawAnnotationForCurrentImage) ===
        stringifyRawAnnotation(selectedAnnotoriousAnnotation)
    ) {
      return undefined;
    }

    return updateAnnotationRawPayload({
      id: annotationId,
      rawAnnotation: selectedAnnotoriousAnnotation,
    });
  }, [annotator, objectUrl]);

  const annotationStyle = (
    annotation: ImageAnnotation,
    state?: AnnotationState,
  ): DrawingStyle => {
    const annotationId = getRawAnnotationId(annotation);
    const annotationRecord = annotationId ? annotationRecordById.get(annotationId) : undefined;
    const color = annotationRecord
      ? getAnnotationColor(annotationRecord.type)
      : fallbackAnnotationColor;
    const isSelected = state?.selected ?? false;
    const isHovered = state?.hovered ?? false;

    return {
      fill: color,
      fillOpacity: isSelected ? 0.28 : isHovered ? 0.22 : 0.14,
      stroke: color,
      strokeOpacity: 1,
      strokeWidth: isSelected ? 4 : isHovered ? 3 : 2,
    };
  };

  const annotationFilter = (annotation: ImageAnnotation): boolean => {
    const annotationId = getRawAnnotationId(annotation);
    const annotationRecord = annotationId ? annotationRecordById.get(annotationId) : undefined;

    if (!annotationRecord) {
      return true;
    }

    if (!visibleAnnotationTypeIds.includes(annotationRecord.type)) {
      return false;
    }

    if (annotationSourceFilter === 'all') {
      return true;
    }

    if (annotationSourceFilter === 'pending_ai') {
      return isPendingAiAnnotation(annotationRecord);
    }

    return annotationRecord.source === annotationSourceFilter;
  };

  const toggleVisibleAnnotationType = (typeId: string) => {
    setVisibleAnnotationTypeIds((currentVisibleTypes) => {
      if (currentVisibleTypes.includes(typeId)) {
        return currentVisibleTypes.filter((currentTypeId) => currentTypeId !== typeId);
      }

      return [...currentVisibleTypes, typeId];
    });
  };

  useEffect(() => {
    const nextObjectUrl = URL.createObjectURL(photo.blob);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [photo.blob]);
  useEffect(() => {
    if (!annotator || !objectUrl) {
      renderedAnnotationIdsRef.current = new Set();
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const renderableAnnotationRecords = annotationRecordsRef.current
        .map((record) => ({
          record,
          rawAnnotation: normalizeRawAnnotationForImage(record.rawAnnotation, objectUrl, record.id),
        }))
        .filter(({ rawAnnotation }) => isRenderableRawAnnotation(rawAnnotation));

      renderedAnnotationIdsRef.current = new Set(
        renderableAnnotationRecords.map(({ record }) => record.id),
      );

      const rawAnnotations = renderableAnnotationRecords.map(
        ({ rawAnnotation }) => rawAnnotation as Partial<unknown>,
      );

      annotator.setAnnotations(rawAnnotations, true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [annotator, objectUrl, rawAnnotationRevision]);
  useEffect(() => {
    if (!annotator || !selectedAnnotationId) {
      return;
    }

    if (!renderedAnnotationIdsRef.current.has(selectedAnnotationId)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      annotator.setSelected(selectedAnnotationId, true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [annotator, rawAnnotationRevision, selectedAnnotationId]);
  useEffect(() => {
    if (!annotator) {
      return;
    }

    const handlePointerUp = () => {
      window.setTimeout(() => {
        void flushSelectedAnnotationGeometry();
      }, 150);
    };

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [annotator, flushSelectedAnnotationGeometry]);
  useEffect(() => {
    if (!annotator) {
      return;
    }

    const handleSelectionChanged = (annotations: unknown[]) => {
      const selectedAnnotoriousAnnotation = annotations[0] ?? null;
      const annotationId = getRawAnnotationId(selectedAnnotoriousAnnotation);

      selectedAnnotationIdRef.current = annotationId;
      setSelectedAnnotationId(annotationId);
    };

    annotator.on('selectionChanged', handleSelectionChanged);

    return () => {
      annotator.off('selectionChanged', handleSelectionChanged);
    };
  }, [annotator]);


  useEffect(() => {
    if (!annotator) {
      return;
    }

    const handleCreateAnnotation = async (annotation: unknown) => {
      if (!isRenderableRawAnnotation(annotation)) {
        setStatusMessage('Annotation was not saved: invalid geometry. Try drawing it again.');
        return;
      }

      const savedAnnotation = await upsertAnnotationFromAnnotorious({
        photoId: photo.id,
        inspectionId: photo.inspectionId,
        type: effectiveAnnotationType.id,
        label: effectiveAnnotationType.label,
        rawAnnotation: annotation,
      });

      selectedAnnotationIdRef.current = savedAnnotation.id;


      setSelectedAnnotationId(savedAnnotation.id);
      setStatusMessage(`Annotation saved as ${effectiveAnnotationType.label}. Fill the form below.`);
    };

    const handleUpdateAnnotation = async (annotation: unknown) => {
      if (!isRenderableRawAnnotation(annotation)) {
        setStatusMessage('Annotation geometry update was ignored: invalid geometry.');
        return;
      }

      const annotationId = getRawAnnotationId(annotation) ?? selectedAnnotationIdRef.current ?? undefined;
      const updatedAnnotation = await updateAnnotationRawPayload({
        id: annotationId,
        rawAnnotation: annotation,
      });

      if (!updatedAnnotation) {
        setStatusMessage('Annotation geometry update was not saved. Select the annotation and try again.');
        return;
      }

      selectedAnnotationIdRef.current = updatedAnnotation.id;


      setSelectedAnnotationId(updatedAnnotation.id);
      setStatusMessage('Annotation geometry updated.');
    };

    const handleDeleteAnnotation = async (annotation: unknown) => {
      const annotationId = getRawAnnotationId(annotation);

      await deleteAnnotationByAnnotoriousPayload(annotation);

      setSelectedAnnotationId((currentAnnotationId) =>
        currentAnnotationId === annotationId ? null : currentAnnotationId,
      );
      setStatusMessage('Annotation deleted.');
    };

    annotator.on('createAnnotation', handleCreateAnnotation);
    annotator.on('updateAnnotation', handleUpdateAnnotation);
    annotator.on('deleteAnnotation', handleDeleteAnnotation);

    return () => {
      annotator.off('createAnnotation', handleCreateAnnotation);
      annotator.off('updateAnnotation', handleUpdateAnnotation);
      annotator.off('deleteAnnotation', handleDeleteAnnotation);
    };
  }, [annotator, effectiveAnnotationType, photo.id, photo.inspectionId]);

  const handleSelectAnnotation = (annotationId: string) => {
    selectedAnnotationIdRef.current = annotationId;
    setSelectedAnnotationId(annotationId);

    if (!annotator || !renderedAnnotationIdsRef.current.has(annotationId)) {
      return;
    }

    annotator.setSelected(annotationId, true);
  };

  const handleDeleteAnnotationFromPanel = async (annotationId: string) => {
    const confirmed = window.confirm('Delete this annotation?');

    if (!confirmed) {
      return;
    }

    if (annotator) {
      annotator.removeAnnotation(annotationId);
    }

    await deleteAnnotationById(annotationId);

    setSelectedAnnotationId((currentAnnotationId) =>
      currentAnnotationId === annotationId ? null : currentAnnotationId,
    );
    setStatusMessage('Annotation deleted.');
  };

  const handleAcceptAiAnnotation = async (annotation: ImageAnnotationRecord) => {
    if (annotation.source !== 'ai') {
      return;
    }

    await flushSelectedAnnotationGeometry();

    const updatedAnnotation = await updateAnnotationReviewState({
      id: annotation.id,
      source: 'human',
      attributesPatch: {
        _aiReviewStatus: 'accepted',
        _aiAcceptedAt: new Date().toISOString(),
        _aiOriginalSource: 'ai',
      },
    });

    setSelectedAnnotationId(updatedAnnotation?.id ?? annotation.id);
    setStatusMessage('AI suggestion accepted. Source changed to human.');
  };

  const handleClearPendingAiAnnotations = async () => {
    if (pendingAiAnnotations.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Clear ${pendingAiAnnotations.length} pending AI suggestion(s) for this photo?`,
    );

    if (!confirmed) {
      return;
    }

    pendingAiAnnotations.forEach((annotation) => {
      annotator?.removeAnnotation(annotation.id);
    });

    const deletedCount = await clearPendingAiAnnotationsByPhoto(photo.id);

    setSelectedAnnotationId((currentAnnotationId) =>
      currentAnnotationId &&
      pendingAiAnnotations.some((annotation) => annotation.id === currentAnnotationId)
        ? null
        : currentAnnotationId,
    );

    setStatusMessage(`Cleared ${deletedCount} pending AI suggestion(s).`);
  };

  const handleRejectAiAnnotation = async (annotation: ImageAnnotationRecord) => {
    if (annotation.source !== 'ai') {
      return;
    }

    const confirmed = window.confirm('Reject this AI suggestion? The annotation will be deleted.');

    if (!confirmed) {
      return;
    }

    if (annotator) {
      annotator.removeAnnotation(annotation.id);
    }

    await deleteAnnotationById(annotation.id);

    setSelectedAnnotationId((currentAnnotationId) =>
      currentAnnotationId === annotation.id ? null : currentAnnotationId,
    );
    setStatusMessage('AI suggestion rejected and deleted.');
  };

  const handleSaveAnnotationForm = async (attributes: Record<string, unknown>) => {
    if (!selectedAnnotation) {
      return;
    }

    await flushSelectedAnnotationGeometry();

    await updateAnnotationAttributes({
      id: selectedAnnotation.id,
      attributes: {
        ...(selectedAnnotation.attributes ?? {}),
        ...attributes,
      },
    });

    setStatusMessage('Annotation form saved.');
  };

  if (!objectUrl) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        Loading photo...
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <ImageAnnotator
          userSelectAction={UserSelectAction.EDIT}
          style={annotationStyle}
          filter={annotationFilter}
        >
          <img
            src={objectUrl}
            alt={photo.fileName}
            className="mx-auto max-h-[680px] w-auto max-w-full rounded-xl object-contain"
          />
        </ImageAnnotator>
      </div>

      <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold">Annotation panel</h2>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <div className="text-slate-500">File</div>
            <div className="mt-1 break-all text-slate-200">{photo.fileName}</div>
          </div>

          <div>
            <div className="text-slate-500">Photo type</div>
            <div className="mt-1 text-slate-200">{photo.type}</div>
          </div>

          {photo.width && photo.height ? (
            <div>
              <div className="text-slate-500">Size</div>
              <div className="mt-1 text-slate-200">
                {photo.width}×{photo.height}
              </div>
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">New annotation type</span>
            <select
              value={effectiveAnnotationTypeId}
              onChange={(event) => setSelectedAnnotationTypeId(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-400"
            >
              {annotationTypes.map((annotationType) => (
                <option key={annotationType.id} value={annotationType.id}>
                  {annotationType.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-slate-400">
            Draw a rectangle on the photo. Created annotations are saved locally in IndexedDB.
            After creating or selecting an annotation, fill the dynamic form below.
          </div>

          <div className="rounded-xl bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-100">Visible types</h3>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {visibleAnnotationTypeIds.length}/{annotationTypes.length}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {annotationTypes.map((annotationType) => {
                const isVisible = visibleAnnotationTypeIds.includes(annotationType.id);
                const color = getAnnotationColor(annotationType.id);

                return (
                  <button
                    key={annotationType.id}
                    type="button"
                    onClick={() => toggleVisibleAnnotationType(annotationType.id)}
                    className={[
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition',
                      isVisible
                        ? 'border-slate-500 bg-slate-800 text-slate-100'
                        : 'border-slate-800 bg-slate-950 text-slate-500',
                    ].join(' ')}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {annotationType.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="inline-flex items-center gap-2 font-semibold text-slate-100">
                <Filter size={15} />
                Source filter
              </h3>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {visibleAnnotationRecords.length}/{annotationRecords.length}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(['all', 'human', 'ai', 'pending_ai', 'imported'] as AnnotationSourceFilter[]).map((source) => {
                const isActive = annotationSourceFilter === source;

                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setAnnotationSourceFilter(source)}
                    className={[
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition',
                      isActive
                        ? 'border-sky-500 bg-sky-950 text-sky-100'
                        : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-600',
                    ].join(' ')}
                  >
                    {annotationSourceFilterLabels[source]}
                    <span className="rounded-full bg-slate-900 px-2 py-0.5">
                      {sourceCounts[source]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {pendingAiAnnotations.length > 0 ? (
            <div className="rounded-xl border border-sky-900 bg-sky-950/30 p-4 text-sky-100">
              <div className="flex items-center justify-between gap-3">
                <h3 className="inline-flex items-center gap-2 font-semibold">
                  <Bot size={16} />
                  AI review
                </h3>
                <span className="rounded-full bg-sky-950 px-3 py-1 text-xs">
                  {pendingAiAnnotations.length} pending
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-sky-100/80">
                AI suggestions are pending human review. Accept changes source to human. Reject
                deletes the suggestion.
              </p>

              <button
                type="button"
                onClick={handleClearPendingAiAnnotations}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sky-800 bg-sky-950 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-900"
              >
                <XCircle size={14} />
                Clear pending AI suggestions
              </button>
            </div>
          ) : null}

          {statusMessage ? (
            <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-emerald-100">
              {statusMessage}
            </div>
          ) : null}

          <div className="rounded-xl bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-100">Annotations</h3>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {visibleAnnotationRecords.length}
              </span>
            </div>

            {visibleAnnotationRecords.length > 0 ? (
              <div className="mt-4 space-y-3">
                {visibleAnnotationRecords.map((annotation) => (
                  <AnnotationListItem
                    key={annotation.id}
                    annotation={annotation}
                    color={getAnnotationColor(annotation.type)}
                    isSelected={selectedAnnotationId === annotation.id}
                    onSelect={() => handleSelectAnnotation(annotation.id)}
                    onDelete={() => handleDeleteAnnotationFromPanel(annotation.id)}
                    onAcceptAi={() => handleAcceptAiAnnotation(annotation)}
                    onRejectAi={() => handleRejectAiAnnotation(annotation)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-center text-slate-500">
                No annotations for the current filters.
              </div>
            )}
          </div>

          <div className="rounded-xl bg-slate-950 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-100">Dynamic form</h3>
              {selectedAnnotation ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {selectedAnnotation.label}
                  </span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {selectedAnnotation.source}
                  </span>
                </div>
              ) : null}
            </div>

            {selectedAnnotation ? (
              <DynamicFieldsForm
                fields={annotationForm}
                dictionaries={dictionaries}
                values={selectedAnnotation.attributes ?? {}}
                onSubmit={handleSaveAnnotationForm}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-500">
                Select an annotation from the list or create a new one to fill the form.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function AnnotationListItem({
  annotation,
  color,
  isSelected,
  onSelect,
  onDelete,
  onAcceptAi,
  onRejectAi,
}: {
  annotation: ImageAnnotationRecord;
  color: Color;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onAcceptAi: () => void;
  onRejectAi: () => void;
}) {
  const visibleAttributes = Object.entries(annotation.attributes ?? {})
    .filter(([key, value]) => !isInternalAiAttributeKey(key) && isDisplayableAttributeValue(value))
    .slice(0, 4);

  const aiConfidence = getAiConfidence(annotation);
  const aiReviewStatus = getAiReviewStatus(annotation);
  const isAiSuggestion = annotation.source === 'ai';
  const isAcceptedAi = isAcceptedAiAnnotation(annotation);
  const showAiMetadata = hasAiMetadata(annotation);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={[
        'cursor-pointer rounded-xl border bg-slate-900 p-3 text-left transition hover:border-slate-600 hover:bg-slate-800/70',
        isSelected ? 'border-sky-500' : 'border-slate-800',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-medium text-slate-100">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {annotation.label}
          </div>
          <div className="mt-1 font-mono text-xs text-slate-500">{annotation.id}</div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="inline-flex items-center justify-center rounded-lg bg-red-950 p-2 text-red-100 transition hover:bg-red-900"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-800 px-3 py-1">{annotation.type}</span>
        <span
          className={[
            'rounded-full px-3 py-1',
            annotation.source === 'ai'
              ? 'bg-sky-950 text-sky-100'
              : 'bg-slate-800 text-slate-500',
          ].join(' ')}
        >
          {annotation.source}
        </span>
        {isAiSuggestion ? (
          <span className="rounded-full bg-sky-950 px-3 py-1 text-sky-100">
            {aiReviewStatus}
          </span>
        ) : null}
        {isAcceptedAi ? (
          <span className="rounded-full bg-emerald-950 px-3 py-1 text-emerald-100">
            accepted AI
          </span>
        ) : null}
        {aiConfidence !== null ? (
          <span className="rounded-full bg-slate-800 px-3 py-1">
            confidence: {Math.round(aiConfidence * 100)}%
          </span>
        ) : null}
        {isSelected ? (
          <span className="rounded-full bg-sky-950 px-3 py-1 text-sky-100">selected</span>
        ) : null}
      </div>

      {isAiSuggestion ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAcceptAi();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-950 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-900"
          >
            <CheckCircle2 size={14} />
            Accept
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRejectAi();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-950 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-900"
          >
            <XCircle size={14} />
            Reject
          </button>
        </div>
      ) : null}

      {showAiMetadata ? (
        <details className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
          <summary className="inline-flex cursor-pointer items-center gap-2 text-slate-300">
            <Info size={13} />
            AI metadata
          </summary>

          <div className="mt-3 space-y-1">
            {Object.entries(annotation.attributes ?? {})
              .filter(([key]) => isInternalAiAttributeKey(key))
              .map(([key, value]) => (
                <div key={key} className="grid grid-cols-[110px_1fr] gap-2">
                  <span className="text-slate-500">{key}</span>
                  <span className="break-words text-slate-300">
                    {formatAiMetadataValue(value)}
                  </span>
                </div>
              ))}
          </div>
        </details>
      ) : null}

      {visibleAttributes.length > 0 ? (
        <div className="mt-3 space-y-1 rounded-lg bg-slate-950 p-3 text-xs">
          {visibleAttributes.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[90px_1fr] gap-2">
              <span className="capitalize text-slate-500">{formatAttributeKey(key)}</span>
              <span className="break-words text-slate-300">{formatAttributeValue(value)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-slate-800 p-3 text-xs text-slate-600">
          Form is not filled yet.
        </div>
      )}

      <div className="mt-3 text-xs text-slate-600">
        Updated: {formatDate(annotation.updatedAt)}
      </div>
    </div>
  );
}

export function PhotoAnnotatorPage() {
  const { photoId } = useParams();

  const photo = useLiveQuery(
    () => {
      if (!photoId || photoId === 'demo') {
        return Promise.resolve(undefined);
      }

      return getPhotoById(photoId);
    },
    [photoId],
    null,
  );

  if (photo === null) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          Loading photo...
        </div>
      </section>
    );
  }

  if (!photo) {
    return (
      <section className="space-y-6">
        <Link
          to="/inspections"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"
        >
          <ArrowLeft size={16} />
          Back to inspections
        </Link>

        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-xl bg-slate-800 p-3">
            <ImagePlus size={24} />
          </div>
          <h1 className="text-xl font-semibold">Photo not found</h1>
          <p className="mt-2 text-sm text-slate-400">
            Import a photo inside an inspection and open it from the photo gallery.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Link
        to={`/inspections/${photo.inspectionId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"
      >
        <ArrowLeft size={16} />
        Back to inspection
      </Link>

      <div>
        <h1 className="text-3xl font-semibold">Photo Annotator</h1>
        <p className="mt-2 text-slate-400">
          Photo ID: <span className="font-mono text-slate-300">{photo.id}</span>
        </p>
      </div>

      <Annotorious>
        <PhotoAnnotationWorkspace photo={photo} />
      </Annotorious>
    </section>
  );
}
