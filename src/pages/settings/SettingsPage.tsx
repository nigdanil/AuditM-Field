import { Link } from 'react-router';
import { Bot, Database, FileArchive, ImagePlus, Network, Settings } from 'lucide-react';

export function SettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-slate-400">
          Application settings, config sources, storage adapters, and experimental AI features.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-800 p-3">
              <FileArchive size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Storage adapters</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Local download, HTTP upload and webhook adapters are configured in Export Center.
                This keeps storage delivery close to ZIP export/import workflow.
              </p>

              <Link
                to="/export"
                className="mt-4 inline-flex rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white"
              >
                Open Export Center
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-800 p-3">
              <Network size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">External transport</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Recommended integration path: AuditM-Field exports a ZIP package, then sends it to
                a backend, webhook or n8n workflow. AI/OCR/LLM processing should live behind that
                transport layer, not directly inside the PWA.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-800 p-3">
              <ImagePlus size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Annotator entry point</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The Annotator page currently opens a concrete photo route. If opened without a
                selected photo, it shows Photo not found. A future UX polish step can turn it into a
                photo picker / recent photos screen.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-800 p-3">
              <Bot size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">AI-ready layer</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                OCR, CV, LLM and RAG integrations should be optional adapters. The PWA should keep
                human-entered data and imported/AI-generated suggestions separated by source.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-800 p-3">
              <Database size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Local-first data</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Inspections, photos, annotations, checklist answers and export jobs are stored in
                IndexedDB. ZIP export/import is the main portability mechanism for MVP.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-800 p-3">
              <Settings size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Next settings candidates</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Later this page can host default config source, storage adapter presets, import/export
                cleanup actions, local database size indicator and experimental feature toggles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
