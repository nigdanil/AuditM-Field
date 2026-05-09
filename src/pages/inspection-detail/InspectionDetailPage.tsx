import type { ChangeEvent } from 'react';
import { Link, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';

import { inspectionStatusLabels } from '../../entities/inspection/model';
import { inspectionStatusValues } from '../../entities/inspection/schemas';
import type { InspectionStatus } from '../../entities/inspection/types';
import {
  getInspectionById,
  updateInspectionStatus,
} from '../../services/db/inspectionRepository';

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

  const handleStatusChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    if (!inspection) {
      return;
    }

    await updateInspectionStatus(inspection.id, event.target.value as InspectionStatus);
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

        <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
          <h2 className="text-lg font-semibold">Photo gallery will be here</h2>
          <p className="mt-2 text-sm text-slate-400">
            The next MVP step will add photo import from gallery and photo records linked to this
            inspection.
          </p>
        </div>
      </div>
    </section>
  );
}
