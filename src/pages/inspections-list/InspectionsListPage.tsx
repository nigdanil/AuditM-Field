import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertCircle, ClipboardCheck, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { loadActiveConfig } from '../../core/config/configStorage';
import type { InspectionStatus } from '../../entities/inspection/types';
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
  const { t } = useTranslation('inspections');

  const inspections = useLiveQuery(() => listInspections(), [], []);
  const [activeConfigState] = useState(() => loadActiveConfig());
  const [formState, setFormState] = useState<InspectionFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeConfig = activeConfigState?.config;

  const inspectionStatusLabels: Record<InspectionStatus, string> = {
    DRAFT: t('status.DRAFT'),
    READY: t('status.READY'),
    EXPORTED: t('status.EXPORTED'),
    ARCHIVED: t('status.ARCHIVED'),
    SYNC_PENDING: t('status.SYNC_PENDING'),
    SYNCED: t('status.SYNCED'),
    SYNC_FAILED: t('status.SYNC_FAILED'),
  };

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
      setErrorMessage(t('errors.loadConfig'));
      return;
    }

    const title = formState.title.trim();

    if (!title) {
      setErrorMessage(t('errors.titleRequired'));
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
      setErrorMessage(error instanceof Error ? error.message : t('errors.createFailed'));
    }
  };

  const handleDeleteInspection = async (inspectionId: string) => {
    const confirmed = window.confirm(t('confirm.delete'));

    if (!confirmed) {
      return;
    }

    await deleteInspection(inspectionId);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
          <p className="mt-2 text-slate-400">{t('description')}</p>
        </div>

        {activeConfig ? (
          <div className="rounded-2xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            {t('activeConfig', { name: activeConfig.name })}
          </div>
        ) : (
          <Link
            to="/config-manager"
            className="rounded-2xl border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-900/40"
          >
            {t('loadConfigFirst')}
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
            <h2 className="text-xl font-semibold">{t('newInspection.title')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('newInspection.description')}</p>
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
            <span className="text-sm font-medium text-slate-300">
              {t('newInspection.fields.title')}
            </span>
            <input
              value={formState.title}
              onChange={(event) => updateFormField('title', event.target.value)}
              placeholder={t('newInspection.placeholders.title')}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-slate-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {t('newInspection.fields.location')}
            </span>
            <input
              value={formState.locationName}
              onChange={(event) => updateFormField('locationName', event.target.value)}
              placeholder={t('newInspection.placeholders.location')}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-slate-400"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-300">
              {t('newInspection.fields.address')}
            </span>
            <input
              value={formState.address}
              onChange={(event) => updateFormField('address', event.target.value)}
              placeholder={t('newInspection.placeholders.address')}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-slate-400"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-300">
              {t('newInspection.fields.comment')}
            </span>
            <textarea
              value={formState.comment}
              onChange={(event) => updateFormField('comment', event.target.value)}
              placeholder={t('newInspection.placeholders.comment')}
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
          {t('newInspection.create')}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t('localInspections.title')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('localInspections.description')}</p>
          </div>

          <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm text-slate-300">
            {t('localInspections.total', { count: inspections.length })}
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
                      {t('localInspections.updated', {
                        date: new Date(inspection.updatedAt).toLocaleString(),
                      })}
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteInspection(inspection.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-950 px-3 py-2 text-sm text-red-100 transition hover:bg-red-900"
                  >
                    <Trash2 size={15} />
                    {t('actions.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
            <h3 className="text-lg font-semibold">{t('localInspections.emptyTitle')}</h3>
            <p className="mt-2 text-sm text-slate-400">
              {t('localInspections.emptyDescription')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
