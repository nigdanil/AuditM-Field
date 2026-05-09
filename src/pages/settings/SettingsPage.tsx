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
          <h2 className="text-lg font-semibold">Storage adapters</h2>
          <p className="mt-2 text-sm text-slate-400">
            Local download, HTTP upload, webhook, S3, Google Drive, and other adapters.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">AI-ready layer</h2>
          <p className="mt-2 text-sm text-slate-400">
            OCR, CV, LLM, and RAG integrations will be optional adapters.
          </p>
        </div>
      </div>
    </section>
  );
}
