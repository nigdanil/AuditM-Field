export function ConfigManagerPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Config Manager</h1>
        <p className="mt-2 text-slate-400">
          Load audit configurations from GitHub registry, local JSON files, or direct URLs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">GitHub registry</h2>
          <p className="mt-2 text-sm text-slate-400">
            Later this screen will load index.json and show available audit configs.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Local JSON</h2>
          <p className="mt-2 text-sm text-slate-400">
            Users will be able to import config.json from a local file.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Direct URL</h2>
          <p className="mt-2 text-sm text-slate-400">
            A config can be loaded from any compatible public JSON URL.
          </p>
        </div>
      </div>
    </section>
  );
}
