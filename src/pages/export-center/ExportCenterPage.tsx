export function ExportCenterPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Export Center</h1>
        <p className="mt-2 text-slate-400">
          Export inspections as ZIP packages with photos, annotations, active config, and manifest.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold">ZIP export pipeline</h2>
        <div className="mt-4 rounded-xl bg-slate-950 p-4 font-mono text-sm text-slate-300">
          inspection.json → annotations.json → config.json → manifest.json → photos → ZIP
        </div>
      </div>
    </section>
  );
}
