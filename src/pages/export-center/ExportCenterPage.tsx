import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileArchive,
  RefreshCw,
  Settings,
  Trash2,
  Upload,
  Wifi,
} from 'lucide-react';

import { exportJobAdapterLabels, exportJobStatusLabels } from '../../entities/export-job/model';
import type { ExportJob, ExportJobAdapterId } from '../../entities/export-job/types';
import { loadActiveConfig } from '../../core/config/configStorage';
import { inspectionStatusLabels } from '../../entities/inspection/model';
import type { Inspection } from '../../entities/inspection/types';
import {
  listInspections,
  updateInspectionStatus,
} from '../../services/db/inspectionRepository';
import {
  clearExportJobs,
  createExportJob,
  deleteExportJob,
  listExportJobs,
  updateExportJob,
} from '../../services/db/exportJobRepository';
import {
  buildInspectionExportPackage,
  buildInspectionExportPreview,
  type BuildInspectionExportPreviewResult,
} from '../../services/export/exportPackage';
import { importInspectionPackage } from '../../services/import/importPackage';
import {
  getStorageAdapterTargetUrl,
  loadStorageAdapterSettings,
  saveStorageAdapterSettings,
  type StorageAdapterSettings,
} from '../../services/storage/settings/storageAdapterSettings';
import { getStorageAdapter, listStorageAdapters } from '../../services/storage/storageAdapterRegistry';

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

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

function canExportInspection(input: {
  preview?: BuildInspectionExportPreviewResult;
}): boolean {
  return Boolean(input.preview?.canExport);
}

function getStatusClass(status: ExportJob['status']): string {
  if (status === 'SUCCESS') {
    return 'border-emerald-900 bg-emerald-950/30 text-emerald-100';
  }

  if (status === 'FAILED') {
    return 'border-red-900 bg-red-950/40 text-red-100';
  }

  if (status === 'UPLOADING') {
    return 'border-sky-900 bg-sky-950/30 text-sky-100';
  }

  return 'border-slate-800 bg-slate-900 text-slate-300';
}

export function ExportCenterPage() {
  const inspections = useLiveQuery(() => listInspections(), [], []);
  const exportJobs = useLiveQuery(() => listExportJobs(), [], []);
  const [activeConfigState] = useState(() => loadActiveConfig());
  const [storageSettings, setStorageSettings] = useState<StorageAdapterSettings>(() =>
    loadStorageAdapterSettings(),
  );
  const [exportingInspectionId, setExportingInspectionId] = useState<string | null>(null);
  const [isImportingPackage, setIsImportingPackage] = useState(false);
  const [isSavingStorageSettings, setIsSavingStorageSettings] = useState(false);
  const [isTestingStorageAdapter, setIsTestingStorageAdapter] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeConfig = activeConfigState?.config ?? null;
  const activeStorageAdapter = getStorageAdapter(storageSettings.adapterId);
  const activeStorageAdapterConfigured = activeStorageAdapter.isConfigured(storageSettings);

  const exportPreviews =
    useLiveQuery(async (): Promise<Record<string, BuildInspectionExportPreviewResult>> => {
      const entries = await Promise.all(
        inspections.map(async (inspection) => {
          const preview = await buildInspectionExportPreview({
            inspectionId: inspection.id,
            activeConfig,
            configSource: activeConfigState?.source,
            configLoadedAt: activeConfigState?.loadedAt,
          });

          return [inspection.id, preview] as const;
        }),
      );

      return Object.fromEntries(entries);
    }, [inspections, activeConfig?.id, activeConfigState?.source, activeConfigState?.loadedAt]) ??
    {};

  const updateStorageSettingsField = <K extends keyof StorageAdapterSettings>(
    field: K,
    value: StorageAdapterSettings[K],
  ) => {
    setStorageSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveStorageSettings = () => {
    setIsSavingStorageSettings(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      saveStorageAdapterSettings(storageSettings);
      setSuccessMessage('Storage adapter settings saved.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to save storage adapter settings.',
      );
    } finally {
      setIsSavingStorageSettings(false);
    }
  };

  const handleTestStorageAdapter = async () => {
    try {
      setIsTestingStorageAdapter(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!activeStorageAdapter.isConfigured(storageSettings)) {
        throw new Error(`${activeStorageAdapter.name} is not configured.`);
      }

      const result = activeStorageAdapter.testConnection
        ? await activeStorageAdapter.testConnection(storageSettings)
        : {
            ok: true,
            status: 200,
            responseText: `${activeStorageAdapter.name} does not require connection testing.`,
          };

      setSuccessMessage(
        `${activeStorageAdapter.name}: ${result.responseText ?? 'adapter test completed.'}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Storage adapter test failed.',
      );
    } finally {
      setIsTestingStorageAdapter(false);
    }
  };

  const handleImportPackage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      setIsImportingPackage(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await importInspectionPackage(file);

      setSuccessMessage(
        `Imported "${result.inspection.title}" — ${result.photosImported} photos, ${result.annotationsImported} annotations.`,
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to import package.');
    } finally {
      setIsImportingPackage(false);
    }
  };

  const runStorageAdapter = async (
    inspection: Inspection,
    adapterId: ExportJobAdapterId,
  ): Promise<void> => {
    const runSettings: StorageAdapterSettings = {
      ...storageSettings,
      adapterId,
    };
    const adapter = getStorageAdapter(adapterId);

    if (!adapter.isConfigured(runSettings)) {
      throw new Error(`${adapter.name} is not configured.`);
    }

    const result = await buildInspectionExportPackage({
      inspectionId: inspection.id,
      activeConfig,
      configSource: activeConfigState?.source,
      configLoadedAt: activeConfigState?.loadedAt,
    });

    const job = await createExportJob({
      inspectionId: inspection.id,
      inspectionTitle: inspection.title,
      adapterId,
      fileName: result.fileName,
      packageSize: result.blob.size,
      targetUrl: getStorageAdapterTargetUrl(runSettings),
      metadata: {
        manifest: result.manifest,
      },
    });

    try {
      await updateExportJob(job.id, {
        status: 'UPLOADING',
        attempts: job.attempts + 1,
        startedAt: new Date().toISOString(),
      });

      const uploadResult = await adapter.uploadPackage({
        file: result.blob,
        fileName: result.fileName,
        metadata: {
          manifest: result.manifest,
          inspectionId: inspection.id,
          inspectionTitle: inspection.title,
          adapterId,
        },
        settings: runSettings,
      });

      await updateExportJob(job.id, {
        status: 'SUCCESS',
        responseStatus: uploadResult.status,
        responseText: uploadResult.responseText,
        completedAt: new Date().toISOString(),
      });

      if (inspection.status !== 'ARCHIVED' && inspection.status !== 'EXPORTED') {
        await updateInspectionStatus(inspection.id, 'EXPORTED');
      }

      const actionLabel = adapterId === 'local-download' ? 'Local download started' : 'Upload completed';

      setSuccessMessage(
        `${actionLabel}: "${inspection.title}" — ${result.manifest.counts.photos} photos, ${result.manifest.counts.annotations} annotations.`,
      );
    } catch (error) {
      await updateExportJob(job.id, {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Storage adapter failed.',
        completedAt: new Date().toISOString(),
      });

      throw error;
    }
  };

  const handleRunStorageAdapter = async (
    inspection: Inspection,
    adapterId: ExportJobAdapterId,
  ) => {
    try {
      setExportingInspectionId(inspection.id);
      setErrorMessage(null);
      setSuccessMessage(null);

      await runStorageAdapter(inspection, adapterId);
    } catch (error) {
      const prefix = adapterId === 'local-download' ? 'Local download failed' : 'Upload failed';
      const details = error instanceof Error ? error.message : 'Failed to export package.';

      setErrorMessage(`${prefix}: ${details}`);
    } finally {
      setExportingInspectionId(null);
    }
  };

  const handleRetryExportJob = async (job: ExportJob) => {
    const inspection = inspections.find((candidate) => candidate.id === job.inspectionId);

    if (!inspection) {
      setErrorMessage('Cannot retry: inspection is no longer available.');
      return;
    }

    await handleRunStorageAdapter(inspection, job.adapterId);
  };

  const handleDeleteExportJob = async (job: ExportJob) => {
    const confirmed = window.confirm(`Delete export job for "${job.inspectionTitle}"?`);

    if (!confirmed) {
      return;
    }

    await deleteExportJob(job.id);
  };

  const handleClearExportJobs = async () => {
    const confirmed = window.confirm('Clear all export jobs?');

    if (!confirmed) {
      return;
    }

    await clearExportJobs();
    setSuccessMessage('Export jobs cleared.');
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Export Center</h1>
          <p className="mt-2 text-slate-400">
            Export, import, download and upload ZIP packages through storage adapters.
          </p>
        </div>

        {activeConfig ? (
          <div className="rounded-2xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            Active config: <span className="font-semibold">{activeConfig.name}</span>
            <div className="mt-1 font-mono text-xs text-emerald-200/70">{activeConfig.id}</div>
          </div>
        ) : (
          <Link
            to="/config-manager"
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-900/40"
          >
            <Settings size={16} />
            Load config first
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold">ZIP package pipeline</h2>
        <div className="mt-4 rounded-xl bg-slate-950 p-4 font-mono text-sm text-slate-300">
          manifest.json → config.json → inspections/inspection.json → photos/photos.metadata.json
          → annotations/annotations.json → photos blobs → ZIP → storage adapter
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Import package</h2>
            <p className="mt-1 text-sm text-slate-400">
              Restore an exported ZIP package back into local IndexedDB. Re-importing the same
              package updates existing records by id.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white">
            <Upload size={16} />
            {isImportingPackage ? 'Importing...' : 'Import ZIP'}
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              className="hidden"
              disabled={isImportingPackage}
              onChange={handleImportPackage}
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Storage adapter</h2>
            <p className="mt-1 text-sm text-slate-400">
              Choose how to deliver generated ZIP packages: local download, HTTP endpoint or webhook.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleTestStorageAdapter}
              disabled={isTestingStorageAdapter || !activeStorageAdapterConfigured}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
            >
              <Wifi size={16} />
              {isTestingStorageAdapter ? 'Testing...' : 'Test adapter'}
            </button>

            <button
              type="button"
              onClick={handleSaveStorageSettings}
              disabled={isSavingStorageSettings}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              <Settings size={16} />
              {isSavingStorageSettings ? 'Saving...' : 'Save adapter settings'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Adapter</span>
            <select
              value={storageSettings.adapterId}
              onChange={(event) =>
                updateStorageSettingsField(
                  'adapterId',
                  event.target.value as ExportJobAdapterId,
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-400"
            >
              {listStorageAdapters().map((adapter) => (
                <option key={adapter.id} value={adapter.id}>
                  {adapter.name}
                </option>
              ))}
            </select>
          </label>

          {storageSettings.adapterId === 'http-upload' ? (
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-medium text-slate-300">HTTP upload URL</span>
              <input
                value={storageSettings.httpUploadUrl}
                onChange={(event) => updateStorageSettingsField('httpUploadUrl', event.target.value)}
                placeholder="https://example.com/api/upload"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-slate-400"
              />
            </label>
          ) : null}

          {storageSettings.adapterId === 'webhook' ? (
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-medium text-slate-300">Webhook URL</span>
              <input
                value={storageSettings.webhookUrl}
                onChange={(event) => updateStorageSettingsField('webhookUrl', event.target.value)}
                placeholder="https://example.com/webhook/auditm-field"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-slate-400"
              />
            </label>
          ) : null}

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400 lg:col-span-3">
            <div className="font-medium text-slate-200">{activeStorageAdapter.name}</div>
            <p className="mt-2">{activeStorageAdapter.description}</p>
            <div className="mt-3">
              Status:{' '}
              <span
                className={
                  activeStorageAdapterConfigured ? 'text-emerald-300' : 'text-amber-300'
                }
              >
                {activeStorageAdapterConfigured ? 'configured' : 'not configured'}
              </span>
            </div>

            {storageSettings.adapterId !== 'local-download' ? (
              <div className="mt-4 rounded-lg border border-dashed border-slate-800 bg-slate-900 p-3 text-xs leading-5 text-slate-400">
                Mock endpoint tip: for a quick manual test you can use a local mock server,
                an n8n Webhook node, or any endpoint that accepts multipart/form-data fields
                named <span className="font-mono text-slate-300">file</span> and{' '}
                <span className="font-mono text-slate-300">metadata</span>.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Available inspections</h2>
            <p className="mt-1 text-sm text-slate-400">
              Download locally or upload through the configured storage adapter.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm text-slate-300">
            Total: <span className="font-semibold text-slate-100">{inspections.length}</span>
          </div>
        </div>

        {inspections.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {inspections.map((inspection) => {
              const preview = exportPreviews[inspection.id];
              const isExporting = exportingInspectionId === inspection.id;
              const exportEnabled = canExportInspection({ preview });
              const selectedAdapterIsLocal = storageSettings.adapterId === 'local-download';

              return (
                <div
                  key={inspection.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-slate-800 p-3">
                          <FileArchive size={20} />
                        </div>

                        <div>
                          <Link
                            to={`/inspections/${inspection.id}`}
                            className="text-lg font-semibold transition hover:text-slate-300"
                          >
                            {inspection.title}
                          </Link>

                          <div className="mt-1 font-mono text-xs text-slate-500">
                            {inspection.id}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-900 px-3 py-1">
                          {inspectionStatusLabels[inspection.status]}
                        </span>
                        <span className="rounded-full bg-slate-900 px-3 py-1">
                          {inspection.configName}
                        </span>
                        <span className="rounded-full bg-slate-900 px-3 py-1">
                          {inspection.configId}
                        </span>
                        <span className="rounded-full bg-slate-900 px-3 py-1">
                          {preview ? `${preview.photoCount} photos` : 'photos: ...'}
                        </span>
                        <span className="rounded-full bg-slate-900 px-3 py-1">
                          {preview ? `${preview.annotationCount} annotations` : 'annotations: ...'}
                        </span>
                        {inspection.locationName ? (
                          <span className="rounded-full bg-slate-900 px-3 py-1">
                            {inspection.locationName}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 text-xs text-slate-600">
                        Updated: {formatDate(inspection.updatedAt)}
                      </div>

                      {preview?.fileName ? (
                        <div className="mt-3 rounded-xl bg-slate-900 px-4 py-3 font-mono text-xs text-slate-400">
                          {preview.fileName}
                        </div>
                      ) : null}

                      {preview?.disabledReason ? (
                        <div className="mt-3 rounded-xl border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
                          {preview.disabledReason}
                        </div>
                      ) : null}

                      {preview ? (
                        <details className="mt-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
                          <summary className="cursor-pointer text-sm font-medium text-slate-300">
                            Preview manifest
                          </summary>

                          <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-300">
                            {JSON.stringify(preview.manifest, null, 2)}
                          </pre>
                        </details>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={!exportEnabled || isExporting}
                        onClick={() => handleRunStorageAdapter(inspection, 'local-download')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                      >
                        <Download size={16} />
                        {isExporting ? 'Exporting...' : 'Download ZIP'}
                      </button>

                      {!selectedAdapterIsLocal ? (
                        <button
                          type="button"
                          disabled={!exportEnabled || isExporting || !activeStorageAdapterConfigured}
                          onClick={() => handleRunStorageAdapter(inspection, storageSettings.adapterId)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                        >
                          <Upload size={16} />
                          {isExporting ? 'Uploading...' : `Upload via ${activeStorageAdapter.name}`}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
            <h3 className="text-lg font-semibold">No inspections yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Create an inspection, import photos, add annotations or import an existing ZIP package.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Export jobs</h2>
            <p className="mt-1 text-sm text-slate-400">
              Local downloads and uploads are tracked here. Failed jobs can be retried.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleClearExportJobs()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-100 transition hover:bg-red-900"
          >
            <Trash2 size={16} />
            Clear jobs
          </button>
        </div>

        {exportJobs.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {exportJobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="font-semibold">{job.inspectionTitle}</div>
                    <div className="mt-1 font-mono text-xs text-slate-500">{job.fileName}</div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full border px-3 py-1 ${getStatusClass(job.status)}`}>
                        {exportJobStatusLabels[job.status]}
                      </span>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-slate-500">
                        {exportJobAdapterLabels[job.adapterId]}
                      </span>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-slate-500">
                        {formatFileSize(job.packageSize)}
                      </span>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-slate-500">
                        attempts: {job.attempts}
                      </span>
                    </div>

                    {job.targetUrl ? (
                      <div className="mt-3 break-all rounded-xl bg-slate-900 px-4 py-3 text-xs text-slate-400">
                        {job.targetUrl}
                      </div>
                    ) : null}

                    {job.errorMessage ? (
                      <div className="mt-3 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-100">
                        {job.errorMessage}
                      </div>
                    ) : null}

                    {job.responseText ? (
                      <details className="mt-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
                        <summary className="cursor-pointer text-sm font-medium text-slate-300">
                          Response
                        </summary>
                        <pre className="mt-4 max-h-56 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-300">
                          {job.responseText}
                        </pre>
                      </details>
                    ) : null}

                    <div className="mt-3 text-xs text-slate-600">
                      Updated: {formatDate(job.updatedAt)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {job.status === 'FAILED' ? (
                      <button
                        type="button"
                        onClick={() => void handleRetryExportJob(job)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white"
                      >
                        <RefreshCw size={16} />
                        Retry
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void handleDeleteExportJob(job)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-100 transition hover:bg-red-900"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
            <h3 className="text-lg font-semibold">No export jobs yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Download or upload a package to create the first export job.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
