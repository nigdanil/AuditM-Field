import { ClipboardCheck, Database, FileArchive, ImagePlus } from 'lucide-react';

const cards = [
  {
    title: 'Configs',
    description: 'Load audit configs from GitHub, local JSON files, or direct URLs.',
    icon: Database,
  },
  {
    title: 'Inspections',
    description: 'Create local field inspections and attach photos from gallery.',
    icon: ClipboardCheck,
  },
  {
    title: 'Annotation',
    description: 'Mark zones on images and fill dynamic checklists.',
    icon: ImagePlus,
  },
  {
    title: 'Export',
    description: 'Export ZIP packages with photos, annotations, config, and manifest.',
    icon: FileArchive,
  },
];

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Open-source PWA
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          AuditM-Field
        </h1>

        <p className="mt-4 max-w-3xl text-slate-400">
          Configurable offline-first PWA for field photo audits, visual image annotation,
          dynamic checklists, and structured ZIP/JSON export.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">Gallery-first</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">Config-first</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">Offline-first</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">AI-ready</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <div className="mb-4 inline-flex rounded-xl bg-slate-800 p-3">
                <Icon size={22} />
              </div>

              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{card.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
