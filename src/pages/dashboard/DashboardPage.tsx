import { ClipboardCheck, Database, FileArchive, ImagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const cards = [
  {
    titleKey: 'cards.configs.title',
    descriptionKey: 'cards.configs.description',
    icon: Database,
  },
  {
    titleKey: 'cards.inspections.title',
    descriptionKey: 'cards.inspections.description',
    icon: ClipboardCheck,
  },
  {
    titleKey: 'cards.annotation.title',
    descriptionKey: 'cards.annotation.description',
    icon: ImagePlus,
  },
  {
    titleKey: 'cards.export.title',
    descriptionKey: 'cards.export.description',
    icon: FileArchive,
  },
] as const;

const tags = [
  'tags.galleryFirst',
  'tags.configFirst',
  'tags.offlineFirst',
  'tags.aiReady',
] as const;

export function DashboardPage() {
  const { t } = useTranslation('dashboard');

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="text-sm font-medium uppercase tracking-wide text-slate-500">
          {t('hero.eyebrow')}
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          {t('hero.title')}
        </h1>

        <p className="mt-4 max-w-3xl text-slate-400">{t('hero.description')}</p>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {tags.map((tagKey) => (
            <span key={tagKey} className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
              {t(tagKey)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.titleKey}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <div className="mb-4 inline-flex rounded-xl bg-slate-800 p-3">
                <Icon size={22} />
              </div>

              <h2 className="text-lg font-semibold">{t(card.titleKey)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {t(card.descriptionKey)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
