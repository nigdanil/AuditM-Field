import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ClipboardCheck, ImagePlus, Trash2 } from 'lucide-react';

import { loadActiveConfig } from '../../core/config/configStorage';
import type { AuditConfig, DynamicFieldConfig } from '../../core/config/types';
import { inspectionStatusLabels } from '../../entities/inspection/model';
import type { Inspection, InspectionStatus } from '../../entities/inspection/types';
import type { PhotoRecord } from '../../entities/photo/types';
import { DynamicFieldsForm } from '../../features/fill-dynamic-form/DynamicFieldsForm';
import {
  getInspectionById,
  updateInspectionAttributes,
  updateInspectionStatus,
} from '../../services/db/inspectionRepository';
import {
  createPhotosFromFiles,
  deletePhoto,
  listPhotosByInspection,
  updatePhotoAttributes,
} from '../../services/db/photoRepository';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function isEmptyChecklistValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value);
  }

  return false;
}

function getRequiredFields(fields: DynamicFieldConfig[]): DynamicFieldConfig[] {
  return fields.filter((field) => field.required);
}

function getCompletedRequiredFieldCount(
  fields: DynamicFieldConfig[],
  values: Record<string, unknown>,
): number {
  return getRequiredFields(fields).filter((field) => !isEmptyChecklistValue(values[field.id]))
    .length;
}

function areRequiredFieldsFilled(
  fields: DynamicFieldConfig[],
  values: Record<string, unknown>,
): boolean {
  return getCompletedRequiredFieldCount(fields, values) === getRequiredFields(fields).length;
}

function getChecklistLabel(
  fields: DynamicFieldConfig[],
  values: Record<string, unknown>,
): string {
  const requiredCount = getRequiredFields(fields).length;

  if (requiredCount === 0) {
    return 'No required fields';
  }

  return `${getCompletedRequiredFieldCount(fields, values)}/${requiredCount} required`;
}

function getAvailableStatusValues(input: {
  currentStatus: InspectionStatus;
  isReady: boolean;
}): InspectionStatus[] {
  const baseStatuses: InspectionStatus[] = input.isReady
    ? ['DRAFT', 'READY', 'ARCHIVED']
    : ['DRAFT', 'ARCHIVED'];

  if (!baseStatuses.includes(input.currentStatus)) {
    return [input.currentStatus, ...baseStatuses];
  }

  return baseStatuses;
}

function isChecklistEditable(status: InspectionStatus): boolean {
  return status === 'DRAFT';
}

function isInspectionReady(input: {
  config: AuditConfig;
  inspection: Inspection;
  photos: PhotoRecord[];
}): boolean {
  const inspectionAttributes = input.inspection.attributes ?? {};
  const inspectionFieldsReady = areRequiredFieldsFilled(
    input.config.inspectionForm,
    inspectionAttributes,
  );

  const hasAtLeastOnePhoto = input.photos.length > 0;
  const photoFieldsReady = input.photos.every((photo) =>
    areRequiredFieldsFilled(input.config.photoForm, photo.attributes ?? {}),
  );

  return inspectionFieldsReady && hasAtLeastOnePhoto && photoFieldsReady;
}

function PhotoThumbnail({ photo }: { photo: PhotoRecord }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const nextObjectUrl = URL.createObjectURL(photo.blob);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [photo.blob]);

  return (
    <div className="overflow-hidden rounded-xl bg-slate-950">
      {objectUrl ? (
        <img
          src={objectUrl}
          alt={photo.fileName}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-44 items-center justify-center text-sm text-slate-500">
          Loading preview...
        </div>
      )}
    </div>
  );
}

export function InspectionDetailPage() {
  const { inspectionId } = useParams();

  const inspection = useLiveQuery(
    () => {
      if (!inspectionId) {
        return Promise.resolve(undefined);
      }

      return getInspectionById(inspectionId);
    },
    [inspectionId],
    null,
  );

  const photos = useLiveQuery(
    () => {
      if (!inspectionId) {
        return Promise.resolve([]);
      }

      return listPhotosByInspection(inspectionId);
    },
    [inspectionId],
    [],
  );

  const [activeConfigState] = useState(() => loadActiveConfig());
  const [selectedPhotoType, setSelectedPhotoType] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [inspectionFormStatus, setInspectionFormStatus] = useState<string | null>(null);
  const [photoFormStatus, setPhotoFormStatus] = useState<string | null>(null);

  const activeConfig = activeConfigState?.config;
  const activeInspectionConfig =
    activeConfig && activeConfig.id === inspection?.configId ? activeConfig : undefined;

  const photoTypes = activeInspectionConfig?.photoTypes ?? [];
  const inspectionForm = activeInspectionConfig?.inspectionForm ?? [];
  const photoForm = activeInspectionConfig?.photoForm ?? [];
  const dictionaries = activeInspectionConfig?.dictionaries ?? {};

  const effectivePhotoType = selectedPhotoType || photoTypes[0]?.id || 'photo';

  const refreshReadyStatus = async (input: {
    nextInspectionAttributes?: Record<string, unknown>;
    nextPhotos?: PhotoRecord[];
  }) => {
    if (!inspection || !activeInspectionConfig) {
      return;
    }

    const nextInspection: Inspection = {
      ...inspection,
      attributes: input.nextInspectionAttributes ?? inspection.attributes ?? {},
    };

    const nextPhotos = input.nextPhotos ?? photos;
    const ready = isInspectionReady({
      config: activeInspectionConfig,
      inspection: nextInspection,
      photos: nextPhotos,
    });

    if (ready && inspection.status === 'DRAFT') {
      await updateInspectionStatus(inspection.id, 'READY');
      return;
    }

    if (!ready && inspection.status === 'READY') {
      await updateInspectionStatus(inspection.id, 'DRAFT');
    }
  };

  const handleStatusChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    if (!inspection) {
      return;
    }

    await updateInspectionStatus(inspection.id, event.target.value as InspectionStatus);
  };

  const handleSaveInspectionForm = async (attributes: Record<string, unknown>) => {
    if (!inspection) {
      return;
    }

    await updateInspectionAttributes({
      id: inspection.id,
      attributes,
    });

    await refreshReadyStatus({
      nextInspectionAttributes: attributes,
      nextPhotos: photos,
    });

    setInspectionFormStatus('Inspection checklist saved.');
  };

  const handleSavePhotoForm = async (
    photo: PhotoRecord,
    attributes: Record<string, unknown>,
  ) => {
    const updatedPhoto = await updatePhotoAttributes({
      id: photo.id,
      attributes,
    });

    const nextPhotos = updatedPhoto
      ? photos.map((currentPhoto) =>
        currentPhoto.id === updatedPhoto.id ? updatedPhoto : currentPhoto,
      )
      : photos;

    await refreshReadyStatus({
      nextInspectionAttributes: inspection?.attributes ?? {},
      nextPhotos,
    });

    setPhotoFormStatus(`Photo checklist saved: ${photo.fileName}`);
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));

    event.target.value = '';

    if (!inspection) {
      return;
    }

    if (imageFiles.length === 0) {
      setUploadError('Select at least one image file.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const createdPhotos = await createPhotosFromFiles({
        inspectionId: inspection.id,
        files: imageFiles,
        type: effectivePhotoType,
      });

      await refreshReadyStatus({
        nextInspectionAttributes: inspection.attributes ?? {},
        nextPhotos: [...photos, ...createdPhotos],
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to import photos.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const confirmed = window.confirm('Delete this photo?');

    if (!confirmed) {
      return;
    }

    await deletePhoto(photoId);

    await refreshReadyStatus({
      nextInspectionAttributes: inspection?.attributes ?? {},
      nextPhotos: photos.filter((photo) => photo.id !== photoId),
    });
  };

  if (inspection === null) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          Loading inspection...
        </div>
      </section>
    );
  }

  if (!inspection) {
    return (
      <section className="space-y-6">
        <Link
          to="/inspections"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"
        >
          <ArrowLeft size={16} />
          Back to inspections
        </Link>

        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-8 text-center text-red-100">
          Inspection not found.
        </div>
      </section>
    );
  }

  const inspectionReady = activeInspectionConfig
    ? isInspectionReady({
      config: activeInspectionConfig,
      inspection,
      photos,
    })
    : false;

  const availableStatusValues = getAvailableStatusValues({
    currentStatus: inspection.status,
    isReady: inspectionReady,
  });

  const checklistsEditable = isChecklistEditable(inspection.status);
  const checklistReadonlyMessage =
    inspection.status === 'ARCHIVED'
      ? 'Inspection is archived. Checklists are hidden.'
      : 'Inspection is ready. Switch status back to Draft to edit checklists.';

  const statusMessage =
    inspection.status === 'ARCHIVED'
      ? 'Inspection is archived.'
      : inspectionReady
        ? 'Checklist complete. Inspection is ready.'
        : 'Checklist is not complete yet.';

  const statusMessageClass =
    inspection.status === 'ARCHIVED'
      ? 'border-slate-700 bg-slate-950 text-slate-300'
      : inspectionReady
        ? 'border-emerald-900 bg-emerald-950/30 text-emerald-100'
        : 'border-amber-900 bg-amber-950/30 text-amber-100';

  return (
    <section className="space-y-6">
      <Link
        to="/inspections"
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"
      >
        <ArrowLeft size={16} />
        Back to inspections
      </Link>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-4 inline-flex rounded-xl bg-slate-800 p-3">
              <ClipboardCheck size={24} />
            </div>

            <h1 className="text-3xl font-semibold">{inspection.title}</h1>

            <p className="mt-3 text-sm text-slate-400">
              ID: <span className="font-mono text-slate-300">{inspection.id}</span>
            </p>
          </div>

          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Status</span>
              <select
                value={inspection.status}
                onChange={handleStatusChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-400"
              >
                {availableStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {inspectionStatusLabels[status]}
                  </option>
                ))}
              </select>
            </label>

            <div className={`rounded-xl border px-4 py-3 text-sm ${statusMessageClass}`}>
              {statusMessage}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-950 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Config</div>
            <div className="mt-2 font-semibold">{inspection.configName}</div>
            <div className="mt-1 font-mono text-xs text-slate-500">{inspection.configId}</div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
            <div className="mt-2 font-semibold">{inspectionStatusLabels[inspection.status]}</div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Created</div>
            <div className="mt-2 text-sm">{new Date(inspection.createdAt).toLocaleString()}</div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Updated</div>
            <div className="mt-2 text-sm">{new Date(inspection.updatedAt).toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <h2 className="text-lg font-semibold">Location</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-slate-500">Name</div>
                <div className="mt-1 text-slate-200">
                  {inspection.locationName || 'Not specified'}
                </div>
              </div>

              <div>
                <div className="text-slate-500">Address</div>
                <div className="mt-1 text-slate-200">{inspection.address || 'Not specified'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <h2 className="text-lg font-semibold">Comment</h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              {inspection.comment || 'No comment.'}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Inspection checklist</h2>
              <p className="mt-2 text-sm text-slate-400">
                Form is built from config.inspectionForm and stored in inspection.attributes.
              </p>
            </div>

            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300">
              {getChecklistLabel(inspectionForm, inspection.attributes ?? {})}
            </span>
          </div>

          {inspectionFormStatus && checklistsEditable ? (
            <div className="mt-4 rounded-xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
              {inspectionFormStatus}
            </div>
          ) : null}

          <div className="mt-5">
            {checklistsEditable ? (
              <DynamicFieldsForm
                fields={inspectionForm}
                dictionaries={dictionaries}
                values={inspection.attributes ?? {}}
                onSubmit={handleSaveInspectionForm}
                submitLabel="Save inspection checklist"
                emptyMessage="No inspection checklist configured for the active config."
              />
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400">
                {checklistReadonlyMessage}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Photo gallery</h2>
              <p className="mt-2 text-sm text-slate-400">
                Import one or more photos from gallery and fill photo-level checklist fields.
              </p>
            </div>

            {checklistsEditable ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-300">Photo type</span>
                  <select
                    value={effectivePhotoType}
                    onChange={(event) => setSelectedPhotoType(event.target.value)}
                    className="w-full min-w-48 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-400"
                  >
                    {photoTypes.length > 0 ? (
                      photoTypes.map((photoType) => (
                        <option key={photoType.id} value={photoType.id}>
                          {photoType.label}
                        </option>
                      ))
                    ) : (
                      <option value="photo">Photo</option>
                    )}
                  </select>
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white">
                  <ImagePlus size={16} />
                  {isUploading ? 'Importing...' : 'Import photos'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            ) : null}
          </div>

          {uploadError ? (
            <div className="mt-5 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-100">
              {uploadError}
            </div>
          ) : null}

          {photoFormStatus && checklistsEditable ? (
            <div className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
              {photoFormStatus}
            </div>
          ) : null}

          {photoForm.length > 0 && !checklistsEditable ? (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400">
              Photo checklists are hidden for the current inspection status. Switch status back to
              Draft to edit photo checklists.
            </div>
          ) : null}

          {photos.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <div key={photo.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                  <PhotoThumbnail photo={photo} />

                  <div className="mt-4 space-y-2 px-1">
                    <div className="font-medium">{photo.fileName}</div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-800 px-3 py-1">{photo.type}</span>
                      <span className="rounded-full bg-slate-800 px-3 py-1">
                        {formatFileSize(photo.size)}
                      </span>
                      {photo.width && photo.height ? (
                        <span className="rounded-full bg-slate-800 px-3 py-1">
                          {photo.width}×{photo.height}
                        </span>
                      ) : null}
                      {photoForm.length > 0 ? (
                        <span className="rounded-full bg-slate-800 px-3 py-1">
                          {getChecklistLabel(photoForm, photo.attributes ?? {})}
                        </span>
                      ) : null}
                    </div>

                    <div className="pt-2 text-xs text-slate-600">
                      Imported: {new Date(photo.createdAt).toLocaleString()}
                    </div>

                    {photoForm.length > 0 && checklistsEditable ? (
                      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <h3 className="mb-3 text-sm font-semibold text-slate-100">
                          Photo checklist
                        </h3>

                        <DynamicFieldsForm
                          fields={photoForm}
                          dictionaries={dictionaries}
                          values={photo.attributes ?? {}}
                          onSubmit={(attributes) => handleSavePhotoForm(photo, attributes)}
                          submitLabel="Save photo checklist"
                          emptyMessage="No photo checklist configured for the active config."
                        />
                      </div>
                    ) : null}

                    <div className="flex gap-2 pt-2">
                      {checklistsEditable ? (
                        <>
                          <Link
                            to={`/photos/${photo.id}/annotate`}
                            className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-white"
                          >
                            Annotate
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="inline-flex items-center justify-center rounded-xl bg-red-950 px-3 py-2 text-sm text-red-100 transition hover:bg-red-900"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <div className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-center text-sm text-slate-500">
                          Photo editing is locked for this status.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
              <h3 className="text-lg font-semibold">No photos yet</h3>
              <p className="mt-2 text-sm text-slate-400">
                Import photos from gallery to start field photo annotation.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
