import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileJson, Link, Trash2, Upload } from 'lucide-react';

import {
  clearActiveConfig,
  loadActiveConfig,
  saveActiveConfig,
} from '../../core/config/configStorage';
import { validateAuditConfig } from '../../core/config/configValidator';
import type { ActiveConfigState, AuditConfig, ConfigLoadSource } from '../../core/config/types';

interface StatusMessage {
  type: 'success' | 'error' | 'info';
  text: string;
  details?: string[];
}

function getConfigStats(config: AuditConfig) {
  return [
    {
      label: 'Photo types',
      value: config.photoTypes.length,
    },
    {
      label: 'Annotation types',
      value: config.annotationTypes.length,
    },
    {
      label: 'Inspection fields',
      value: config.inspectionForm.length,
    },
    {
      label: 'Photo fields',
      value: config.photoForm.length,
    },
    {
      label: 'Annotation fields',
      value: config.annotationForm.length,
    },
    {
      label: 'Dictionaries',
      value: Object.keys(config.dictionaries).length,
    },
  ];
}

function getSourceLabel(source: ConfigLoadSource) {
  switch (source) {
    case 'demo':
      return 'Demo config';
    case 'local-file':
      return 'Local file';
    case 'url':
      return 'Direct URL';
    case 'github':
      return 'GitHub registry';
    default:
      return source;
  }
}

export function ConfigManagerPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeConfigState, setActiveConfigState] = useState<ActiveConfigState | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>({
    type: 'info',
    text: 'No active config loaded yet.',
  });

  useEffect(() => {
    const storedConfig = loadActiveConfig();

    if (storedConfig) {
      setActiveConfigState(storedConfig);
      setStatusMessage({
        type: 'success',
        text: `Active config restored: ${storedConfig.config.name}`,
      });
    }
  }, []);

  const applyConfig = (config: AuditConfig, source: ConfigLoadSource) => {
    const nextState = saveActiveConfig(config, source);

    setActiveConfigState(nextState);
    setStatusMessage({
      type: 'success',
      text: `Config loaded: ${config.name} v${config.version}`,
    });
  };

  const loadDemoConfig = async () => {
    try {
      setStatusMessage({
        type: 'info',
        text: 'Loading demo config...',
      });

      const response = await fetch('/demo-configs/retail-shelf-audit.config.json');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const validationResult = validateAuditConfig(json);

      if (!validationResult.ok) {
        setStatusMessage({
          type: 'error',
          text: validationResult.message,
          details: validationResult.issues,
        });
        return;
      }

      applyConfig(validationResult.config, 'demo');
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load demo config',
      });
    }
  };

  const loadLocalConfig = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const validationResult = validateAuditConfig(json);

      if (!validationResult.ok) {
        setStatusMessage({
          type: 'error',
          text: validationResult.message,
          details: validationResult.issues,
        });
        return;
      }

      applyConfig(validationResult.config, 'local-file');
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to read local config file',
      });
    } finally {
      event.target.value = '';
    }
  };

  const resetActiveConfig = () => {
    clearActiveConfig();
    setActiveConfigState(null);
    setStatusMessage({
      type: 'info',
      text: 'Active config cleared.',
    });
  };

  const activeConfig = activeConfigState?.config;
  const configStats = activeConfig ? getConfigStats(activeConfig) : [];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Config Manager</h1>
        <p className="mt-2 text-slate-400">
          Load audit configurations from GitHub registry, local JSON files, or direct URLs.
        </p>
      </div>

      <div
        className={[
          'rounded-2xl border p-4',
          statusMessage.type === 'success'
            ? 'border-emerald-900 bg-emerald-950/40 text-emerald-100'
            : '',
          statusMessage.type === 'error' ? 'border-red-900 bg-red-950/40 text-red-100' : '',
          statusMessage.type === 'info' ? 'border-slate-800 bg-slate-900 text-slate-300' : '',
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          {statusMessage.type === 'success' ? <CheckCircle2 size={20} /> : null}
          {statusMessage.type === 'error' ? <AlertCircle size={20} /> : null}
          {statusMessage.type === 'info' ? <FileJson size={20} /> : null}

          <div>
            <div className="font-medium">{statusMessage.text}</div>

            {statusMessage.details && statusMessage.details.length > 0 ? (
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm opacity-90">
                {statusMessage.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 inline-flex rounded-xl bg-slate-800 p-3">
            <FileJson size={22} />
          </div>

          <h2 className="text-lg font-semibold">GitHub registry</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Later this screen will load index.json and show available audit configs from a GitHub
            config registry.
          </p>

          <button
            type="button"
            disabled
            className="mt-5 rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-500"
          >
            Coming soon
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 inline-flex rounded-xl bg-slate-800 p-3">
            <Upload size={22} />
          </div>

          <h2 className="text-lg font-semibold">Local JSON</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Import a local config.json file and validate it with Zod before using it in the app.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={loadLocalConfig}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white"
          >
            Upload config.json
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 inline-flex rounded-xl bg-slate-800 p-3">
            <Link size={22} />
          </div>

          <h2 className="text-lg font-semibold">Demo config</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Load the built-in retail shelf audit demo config from public demo-configs.
          </p>

          <button
            type="button"
            onClick={loadDemoConfig}
            className="mt-5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white"
          >
            Load demo config
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Active config</h2>
            <p className="mt-2 text-sm text-slate-400">
              The active config is cached locally and will be restored after page reload.
            </p>
          </div>

          {activeConfig ? (
            <button
              type="button"
              onClick={resetActiveConfig}
              className="inline-flex items-center gap-2 rounded-xl bg-red-950 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-900"
            >
              <Trash2 size={16} />
              Clear active config
            </button>
          ) : null}
        </div>

        {activeConfig ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm uppercase tracking-wide text-slate-500">
                    {getSourceLabel(activeConfigState.source)}
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold">{activeConfig.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    ID: <span className="font-mono text-slate-300">{activeConfig.id}</span>
                  </p>
                  {activeConfig.description ? (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                      {activeConfig.description}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm">
                  <div className="text-slate-500">Version</div>
                  <div className="mt-1 font-mono text-slate-100">{activeConfig.version}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {configStats.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-slate-950 p-4">
                  <div className="text-2xl font-semibold">{stat.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <h3 className="font-semibold">Photo types</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeConfig.photoTypes.map((photoType) => (
                    <span
                      key={photoType.id}
                      className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300"
                    >
                      {photoType.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <h3 className="font-semibold">Annotation types</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeConfig.annotationTypes.map((annotationType) => (
                    <span
                      key={annotationType.id}
                      className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300"
                    >
                      {annotationType.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <h3 className="font-semibold">Dictionaries</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.keys(activeConfig.dictionaries).map((dictionaryName) => (
                    <span
                      key={dictionaryName}
                      className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300"
                    >
                      {dictionaryName}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Loaded at: {new Date(activeConfigState.loadedAt).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
            <h3 className="text-lg font-semibold">No active config</h3>
            <p className="mt-2 text-sm text-slate-400">
              Load the demo config or upload a local config.json file.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
