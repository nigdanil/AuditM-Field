import { Link } from 'react-router';
import { Bot, Database, FileArchive, ImagePlus, Network, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const cards = [
  {
    id: 'storageAdapters',
    icon: FileArchive,
    linkTo: '/export',
    actionKey: 'actions.openExportCenter',
    className: '',
  },
  {
    id: 'externalTransport',
    icon: Network,
    className: '',
  },
  {
    id: 'annotatorEntry',
    icon: ImagePlus,
    className: '',
  },
  {
    id: 'aiReadyLayer',
    icon: Bot,
    className: '',
  },
  {
    id: 'localFirstData',
    icon: Database,
    className: 'md:col-span-2',
  },
  {
    id: 'nextSettingsCandidates',
    icon: Settings,
    className: 'md:col-span-2',
  },
] as const;

export function SettingsPage() {
  const { t } = useTranslation('settings');

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="mt-2 text-slate-400">{t('description')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          const titleKey = `cards.${card.id}.title` as const;
          const descriptionKey = `cards.${card.id}.description` as const;

          return (
            <div
              key={card.id}
              className={[
                'rounded-2xl border border-slate-800 bg-slate-900 p-5',
                card.className,
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-slate-800 p-3">
                  <Icon size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {t(descriptionKey)}
                  </p>

                  {'linkTo' in card && (
                    <Link
                      to={card.linkTo}
                      className="mt-4 inline-flex rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white"
                    >
                      {t(card.actionKey)}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
