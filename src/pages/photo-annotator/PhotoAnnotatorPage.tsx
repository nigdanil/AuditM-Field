import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ImagePlus } from 'lucide-react';

import type { PhotoRecord } from '../../entities/photo/types';
import { getPhotoById } from '../../services/db/photoRepository';

function PhotoCanvasPreview({ photo }: { photo: PhotoRecord }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const nextObjectUrl = URL.createObjectURL(photo.blob);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [photo.blob]);

  if (!objectUrl) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 text-slate-500">
        Loading photo...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <img
        src={objectUrl}
        alt={photo.fileName}
        className="mx-auto max-h-[640px] w-auto max-w-full rounded-xl object-contain"
      />
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

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <PhotoCanvasPreview photo={photo} />

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

            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-slate-400">
              Annotorious image annotation canvas will be mounted here in the next MVP step.
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
