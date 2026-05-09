import { useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertCircle, CheckCircle2, Download, FileArchive, Settings } from 'lucide-react';

import { loadActiveConfig } from '../../core/config/configStorage';
import { inspectionStatusLabels } from '../../entities/inspection/model';
import type { Inspection } from '../../entities/inspection/types';
import {
  listInspections,
  updateInspectionStatus,
} from '../../services/db/inspectionRepository';
import {
  buildInspectionExportPackage,
  downloadBlob,
} from '../../services/export/exportPackage';

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function canExportInspection(input: {
  inspection: Inspection;
  activeConfigId?: string;
}): boolean {
  return Boolean(input.activeConfigId && input.activeConfigId === input.inspection.configId);
}

export function ExportCenterPage() {
  const inspections = useLiveQuery(() => listInspections(), [], []);
  const [activeConfigState] = useState(() => loadActiveConfig());
  const [exportingInspectionId, setExportingInspectionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeConfig = activeConfigState?.config ?? null;

  const handleExportInspection = async (inspection: Inspection) => {
    try {
      setExportingInspectionId(inspection.id);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await buildInspectionExportPackage({
        inspectionId: inspection.id,
        activeConfig,
        configSource: activeConfigState?.source,
        configLoadedAt: activeConfigState?.loadedAt,
      });

      downloadBlob({
        blob: result.blob,
        fileName: result.fileName,
      });

      if (inspection.status !== 'ARCHIVED') {
        await updateInspectionStatus(inspection.id, 'EXPORTED');
      }

      setSuccessMessage(
        `Exported "${inspection.title}" — ${result.manifest.counts.photos} photos, ${result.manifest.counts.annotations} annotations.`,
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to export inspection.');
    } finally {
      setExportingInspectionId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Export Center</h1>
          <p className="mt-2 text-slate-400">
            Export inspections as ZIP packages with photos, annotations, active config, and manifest.
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
        <h2 className="text-lg font-semibold">ZIP export pipeline</h2>
        <div className="mt-4 rounded-xl bg-slate-950 p-4 font-mono text-sm text-slate-300">
          manifest.json → config.json → inspections/inspection.json → photos/photos.metadata.json
          → annotations/annotations.json → photos blobs → ZIP
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
              Choose a local inspection and download a self-contained ZIP package.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm text-slate-300">
            Total: <span className="font-semibold text-slate-100">{inspections.length}</span>
          </div>
        </div>

        {inspections.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {inspections.map((inspection) => {
              const isExporting = exportingInspectionId === inspection.id;
              const exportEnabled = canExportInspection({
                inspection,
                activeConfigId: activeConfig?.id,
              });

              return (
                <div
                  key={inspection.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
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
                        {inspection.locationName ? (
                          <span className="rounded-full bg-slate-900 px-3 py-1">
                            {inspection.locationName}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 text-xs text-slate-600">
                        Updated: {formatDate(inspection.updatedAt)}
                      </div>

                      {!exportEnabled ? (
                        <div className="mt-3 rounded-xl border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
                          Load matching config before export. Expected config:{' '}
                          <span className="font-mono">{inspection.configId}</span>
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      disabled={!exportEnabled || isExporting}
                      onClick={() => handleExportInspection(inspection)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                    >
                      <Download size={16} />
                      {isExporting ? 'Exporting...' : 'Download ZIP'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
            <h3 className="text-lg font-semibold">No inspections yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Create an inspection, import photos, add annotations and return here to export ZIP.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
