export function InspectionsListPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Inspections</h1>
        <p className="mt-2 text-slate-400">
          Create and manage local field inspections.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
        <h2 className="text-lg font-semibold">No inspections yet</h2>
        <p className="mt-2 text-sm text-slate-400">
          The next MVP step will add local inspection creation and IndexedDB persistence.
        </p>
      </div>
    </section>
  );
}
