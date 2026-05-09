import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertCircle, ClipboardCheck, Plus, Trash2 } from 'lucide-react';

import { inspectionStatusLabels } from '../../entities/inspection/model';
import { loadActiveConfig } from '../../core/config/configStorage';
import { createInspection, deleteInspection, listInspections } from '../../services/db/inspectionRepository';

interface InspectionFormState {
  title: string;
  locationName: string;
  address: string;
  comment: string;
}

const initialFormState: InspectionFormState = {
  title: '',
  locationName: '',
  address: '',
  comment: '',
};

export function InspectionsListPage() {
  const navigate = useNavigate();

  const inspections = useLiveQuery(() => listInspections(), [], []);
  const [activeConfigState] = useState(() => loadActiveConfig());
  const [formState, setFormState] = useState<InspectionFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeConfig = activeConfigState?.config;

  const updateFormField = (field: keyof InspectionFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateInspection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!activeConfig) {
      setErrorMessage('Load an active config before creating an inspection.');
      return;
    }

    const title = formState.title.trim();

    if (!title) {
      setErrorMessage('Inspection title is required.');
      return;
    }

    try {
      const inspection = await createInspection({
        configId: activeConfig.id,
        configName: activeConfig.name,
        title,
        locationName: formState.locationName,
        address: formState.address,
        comment: formState.comment,
      });

      setFormState(initialFormState);
      navigate(`/inspections/${inspection.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to create inspection.',
      );
    }
  };

  const handleDeleteInspection = async (inspectionId: string) => {
    const confirmed = window.confirm('Delete this inspection?');

    if (!confirmed) {
      return;
    }

    await deleteInspection(inspectionId);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Inspections</h1>
          <p className="mt-2 text-slate-400">
            Create and manage local field inspections stored in IndexedDB.
          </p>
        </div>

        {activeConfig ? (
          <div className="rounded-2xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            Active config: <span className="font-semibold">{activeConfig.name}</span>
          </div>
        ) : (
          <Link
            to="/config-manager"
            className="rounded-2xl border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-900/40"
          >
            Load config first
          </Link>
        )}
      </div>

      <form
        onSubmit={handleCreateInspection}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-800 p-3">
            <ClipboardCheck size={22} />
          </div>

          <div>
            <h2 className="text-xl font-semibold">New inspection</h2>
            <p className="mt-1 text-sm text-slate-400">
              Create a local inspection linked to the active audit config.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Title *</span>
            <input
              value={formState.title}
              onChange={(event) => updateFormField('title', event.target.value)}
              placeholder="Retail visit / Warehouse zone / Equipment check"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-slate-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Location</span>
            <input
              value={formState.locationName}
              onChange={(event) => updateFormField('locationName', event.target.value)}
              placeholder="Store name / Warehouse / Site"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-slate-400"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-300">Address</span>
            <input
              value={formState.address}
              onChange={(event) => updateFormField('address', event.target.value)}
              placeholder="Optional address"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-slate-400"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-300">Comment</span>
            <textarea
              value={formState.comment}
              onChange={(event) => updateFormField('comment', event.target.value)}
              placeholder="Optional inspection comment"
              rows={3}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-slate-400"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!activeConfig}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          <Plus size={16} />
          Create inspection
        </button>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Local inspections</h2>
            <p className="mt-1 text-sm text-slate-400">
              Stored locally in browser IndexedDB.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm text-slate-300">
            Total: <span className="font-semibold text-slate-100">{inspections.length}</span>
          </div>
        </div>

        {inspections.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {inspections.map((inspection) => (
              <div
                key={inspection.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <Link to={`/inspections/${inspection.id}`} className="group">
                    <div className="text-lg font-semibold transition group-hover:text-slate-300">
                      {inspection.title}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-900 px-3 py-1">
                        {inspectionStatusLabels[inspection.status]}
                      </span>
                      <span className="rounded-full bg-slate-900 px-3 py-1">
                        {inspection.configName}
                      </span>
                      {inspection.locationName ? (
                        <span className="rounded-full bg-slate-900 px-3 py-1">
                          {inspection.locationName}
                        </span>
                      ) : null}
                    </div>

                    {inspection.comment ? (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                        {inspection.comment}
                      </p>
                    ) : null}

                    <div className="mt-3 text-xs text-slate-600">
                      Updated: {new Date(inspection.updatedAt).toLocaleString()}
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteInspection(inspection.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-950 px-3 py-2 text-sm text-red-100 transition hover:bg-red-900"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
            <h3 className="text-lg font-semibold">No inspections yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Create the first inspection using the form above.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
