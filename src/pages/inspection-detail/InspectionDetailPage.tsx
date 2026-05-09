import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ClipboardCheck, ImagePlus, Trash2 } from 'lucide-react';

import { loadActiveConfig } from '../../core/config/configStorage';
import { inspectionStatusLabels } from '../../entities/inspection/model';
import { inspectionStatusValues } from '../../entities/inspection/schemas';
import type { InspectionStatus } from '../../entities/inspection/types';
import type { PhotoRecord } from '../../entities/photo/types';
import {
  getInspectionById,
  updateInspectionStatus,
} from '../../services/db/inspectionRepository';
import {
  createPhotosFromFiles,
  deletePhoto,
  listPhotosByInspection,
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

  const activeConfig = activeConfigState?.config;

  const photoTypes =
    activeConfig && activeConfig.id === inspection?.configId ? activeConfig.photoTypes : [];

  const effectivePhotoType = selectedPhotoType || photoTypes[0]?.id || 'photo';

  const handleStatusChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    if (!inspection) {
      return;
    }

    await updateInspectionStatus(inspection.id, event.target.value as InspectionStatus);
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

      await createPhotosFromFiles({
        inspectionId: inspection.id,
        files: imageFiles,
        type: effectivePhotoType,
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

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Status</span>
            <select
              value={inspection.status}
              onChange={handleStatusChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-400"
            >
              {inspectionStatusValues.map((status) => (
                <option key={status} value={status}>
                  {inspectionStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Photo gallery</h2>
              <p className="mt-2 text-sm text-slate-400">
                Import one or more photos from gallery and store them locally in IndexedDB.
              </p>
            </div>

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
          </div>

          {uploadError ? (
            <div className="mt-5 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-100">
              {uploadError}
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
                    </div>

                    <div className="pt-2 text-xs text-slate-600">
                      Imported: {new Date(photo.createdAt).toLocaleString()}
                    </div>

                    <div className="flex gap-2 pt-2">
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
