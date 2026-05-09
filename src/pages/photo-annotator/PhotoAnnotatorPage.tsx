import { useEffect, useMemo, useState } from 'react';
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
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';

import { loadActiveConfig } from '../../core/config/configStorage';
import type { AnnotationTypeConfig } from '../../core/config/types';
import type { ImageAnnotationRecord } from '../../entities/annotation/types';
import type { PhotoRecord } from '../../entities/photo/types';
import {
  deleteAnnotationByAnnotoriousPayload,
  deleteAnnotationById,
  listAnnotationsByPhoto,
  updateAnnotationRawPayload,
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

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function PhotoAnnotationWorkspace({ photo }: { photo: PhotoRecord }) {
  const annotator = useAnnotator();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [activeConfigState] = useState(() => loadActiveConfig());
  const [selectedAnnotationTypeId, setSelectedAnnotationTypeId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const annotationRecords = useLiveQuery(
    () => listAnnotationsByPhoto(photo.id),
    [photo.id],
    [],
  );
  const [visibleAnnotationTypeIds, setVisibleAnnotationTypeIds] = useState<string[]>([]);

  const annotationTypes = useMemo(() => {
    const configuredTypes = activeConfigState?.config.annotationTypes ?? [];

    return configuredTypes.length > 0 ? configuredTypes : [fallbackAnnotationType];
  }, [activeConfigState]);

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
    if (!annotation || typeof annotation !== 'object') {
      return null;
    }

    const id = (annotation as { id?: unknown }).id;

    return typeof id === 'string' ? id : null;
  };

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

    return visibleAnnotationTypeIds.includes(annotationRecord.type);
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
    if (!annotator) {
      return;
    }

    const rawAnnotations = annotationRecords.map(
      (record) => record.rawAnnotation as Partial<unknown>,
    );

    annotator.setAnnotations(rawAnnotations, true);
  }, [annotator, annotationRecords]);

  useEffect(() => {
    if (!annotator) {
      return;
    }

    const handleCreateAnnotation = async (annotation: unknown) => {
      await upsertAnnotationFromAnnotorious({
        photoId: photo.id,
        inspectionId: photo.inspectionId,
        type: effectiveAnnotationType.id,
        label: effectiveAnnotationType.label,
        rawAnnotation: annotation,
      });

      setStatusMessage(`Annotation saved as ${effectiveAnnotationType.label}.`);
    };

    const handleUpdateAnnotation = async (annotation: unknown) => {
      await updateAnnotationRawPayload({
        rawAnnotation: annotation,
      });

      setStatusMessage('Annotation updated.');
    };

    const handleDeleteAnnotation = async (annotation: unknown) => {
      await deleteAnnotationByAnnotoriousPayload(annotation);
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

  const handleDeleteAnnotationFromPanel = async (annotationId: string) => {
    const confirmed = window.confirm('Delete this annotation?');

    if (!confirmed) {
      return;
    }

    if (annotator) {
      annotator.removeAnnotation(annotationId);
    }

    await deleteAnnotationById(annotationId);
    setStatusMessage('Annotation deleted.');
  };

  if (!objectUrl) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        Loading photo...
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
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

          {statusMessage ? (
            <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-emerald-100">
              {statusMessage}
            </div>
          ) : null}

          <div className="rounded-xl bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-100">Annotations</h3>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {annotationRecords.length}
              </span>
            </div>

            {annotationRecords.length > 0 ? (
              <div className="mt-4 space-y-3">
                {annotationRecords.map((annotation) => (
                  <AnnotationListItem
                    key={annotation.id}
                    annotation={annotation}
                    color={getAnnotationColor(annotation.type)}
                    onSelect={() => annotator?.setSelected(annotation.id, true)}
                    onDelete={() => handleDeleteAnnotationFromPanel(annotation.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-center text-slate-500">
                No annotations yet.
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
  onSelect,
  onDelete,
}: {
  annotation: ImageAnnotationRecord;
  color: Color;
  onSelect: () => void;
  onDelete: () => void;
}) {
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
      className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900 p-3 text-left transition hover:border-slate-600 hover:bg-slate-800/70"
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
        <span className="rounded-full bg-slate-800 px-3 py-1">{annotation.source}</span>
      </div>

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
