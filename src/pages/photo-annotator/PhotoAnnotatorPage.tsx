import { useParams } from 'react-router';

export function PhotoAnnotatorPage() {
  const { photoId } = useParams();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Photo Annotator</h1>
        <p className="mt-2 text-slate-400">
          Photo ID: <span className="font-mono text-slate-300">{photoId}</span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6">
          <div className="text-center">
            <div className="text-lg font-semibold">Image canvas placeholder</div>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Annotorious image annotation canvas will be mounted here in the next steps.
            </p>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Annotation panel</h2>
          <p className="mt-2 text-sm text-slate-400">
            Annotation types, selected zone attributes, and dynamic form will appear here.
          </p>
        </aside>
      </div>
    </section>
  );
}
