import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, ClipboardCheck, ImagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Inspection, InspectionStatus } from '../../entities/inspection/types';
import type { PhotoRecord } from '../../entities/photo/types';
import { listInspections } from '../../services/db/inspectionRepository';
import { listRecentPhotos } from '../../services/db/photoRepository';

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

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function PhotoThumbnail({ photo }: { photo: PhotoRecord }) {
  const { t } = useTranslation('annotator');
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
          {t('entry.labels.loadingPreview')}
        </div>
      )}
    </div>
  );
}

function PhotoCard({ photo }: { photo: PhotoRecord }) {
  const { t } = useTranslation('annotator');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
      <PhotoThumbnail photo={photo} />

      <div className="mt-4 space-y-3 px-1">
        <div>
          <div className="font-medium text-slate-100">{photo.fileName}</div>
          <div className="mt-1 font-mono text-xs text-slate-500">{photo.id}</div>
        </div>

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

        <div className="text-xs text-slate-600">
          {t('entry.labels.imported', { date: formatDate(photo.createdAt) })}
        </div>

        <Link
          to={`/photos/${photo.id}/annotate`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white"
        >
          {t('entry.actions.openAnnotator')}
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

function groupPhotosByInspection(photos: PhotoRecord[]): Record<string, PhotoRecord[]> {
  return photos.reduce<Record<string, PhotoRecord[]>>((acc, photo) => {
    acc[photo.inspectionId] = acc[photo.inspectionId] ?? [];
    acc[photo.inspectionId].push(photo);

    return acc;
  }, {});
}

export function PhotoAnnotatorEntryPage() {
  const { t } = useTranslation('annotator');

  const photos = useLiveQuery(() => listRecentPhotos(60), [], []);
  const inspections = useLiveQuery(() => listInspections(), [], []);

  const inspectionById = useMemo(() => {
    return new Map(inspections.map((inspection) => [inspection.id, inspection]));
  }, [inspections]);

  const groupedPhotos = useMemo(() => groupPhotosByInspection(photos), [photos]);
  const inspectionGroups = Object.entries(groupedPhotos);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('entry.title')}</h1>
        <p className="mt-2 text-slate-400">{t('entry.description')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {t('entry.stats.recentPhotos')}
          </div>
          <div className="mt-2 text-3xl font-semibold">{photos.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {t('entry.stats.inspectionGroups')}
          </div>
          <div className="mt-2 text-3xl font-semibold">{inspectionGroups.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {t('entry.stats.entryPoint')}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            {t('entry.stats.entryPointDescription')}
          </div>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-xl bg-slate-800 p-3">
            <ImagePlus size={24} />
          </div>
          <h2 className="text-xl font-semibold">{t('entry.empty.title')}</h2>
          <p className="mt-2 text-sm text-slate-400">{t('entry.empty.description')}</p>

          <Link
            to="/inspections"
            className="mt-5 inline-flex rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white"
          >
            {t('entry.empty.action')}
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {inspectionGroups.map(([inspectionId, groupPhotos]) => {
            const inspection = inspectionById.get(inspectionId);

            return (
              <InspectionPhotoGroup
                key={inspectionId}
                inspectionId={inspectionId}
                inspection={inspection}
                photos={groupPhotos}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function InspectionPhotoGroup({
  inspectionId,
  inspection,
  photos,
}: {
  inspectionId: string;
  inspection?: Inspection;
  photos: PhotoRecord[];
}) {
  const { t } = useTranslation('annotator');
  const { t: tInspections } = useTranslation('inspections');

  const inspectionStatusLabels: Record<InspectionStatus, string> = {
    DRAFT: tInspections('status.DRAFT'),
    READY: tInspections('status.READY'),
    EXPORTED: tInspections('status.EXPORTED'),
    ARCHIVED: tInspections('status.ARCHIVED'),
    SYNC_PENDING: tInspections('status.SYNC_PENDING'),
    SYNCED: tInspections('status.SYNCED'),
    SYNC_FAILED: tInspections('status.SYNC_FAILED'),
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-800 p-3">
            <ClipboardCheck size={20} />
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              {inspection?.title ?? t('entry.labels.unknownInspection')}
            </h2>
            <div className="mt-1 font-mono text-xs text-slate-500">{inspectionId}</div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {inspection ? (
                <>
                  <span className="rounded-full bg-slate-900 px-3 py-1">
                    {inspectionStatusLabels[inspection.status]}
                  </span>
                  <span className="rounded-full bg-slate-900 px-3 py-1">
                    {inspection.configName}
                  </span>
                  <span className="rounded-full bg-slate-900 px-3 py-1">
                    {inspection.configId}
                  </span>
                  {inspection.locationName ? (
                    <span className="rounded-full bg-slate-900 px-3 py-1">
                      {inspection.locationName}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="rounded-full bg-amber-950 px-3 py-1 text-amber-100">
                  {t('entry.labels.inspectionNotFound')}
                </span>
              )}

              <span className="rounded-full bg-slate-900 px-3 py-1">
                {t('entry.labels.photoCount', { count: photos.length })}
              </span>
            </div>
          </div>
        </div>

        {inspection ? (
          <Link
            to={`/inspections/${inspection.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
          >
            {t('entry.actions.openInspection')}
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </div>
    </div>
  );
}
