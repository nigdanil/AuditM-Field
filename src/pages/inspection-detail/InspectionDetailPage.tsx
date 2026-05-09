import { useParams } from 'react-router';

export function InspectionDetailPage() {
  const { inspectionId } = useParams();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Inspection Detail</h1>
        <p className="mt-2 text-slate-400">
          Inspection ID: <span className="font-mono text-slate-300">{inspectionId}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold">Inspection workspace</h2>
        <p className="mt-2 text-sm text-slate-400">
          This page will contain inspection metadata, photo gallery, checklist status,
          and export actions.
        </p>
      </div>
    </section>
  );
}
