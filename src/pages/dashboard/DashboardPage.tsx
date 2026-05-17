import { ClipboardCheck, Database, FileArchive, ImagePlus, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import type { Permission, UserRole } from '../../entities/user/types';
import { useAuthStore } from '../../features/auth/authStore';
import { can } from '../../features/auth/permissions';

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

const roleWorkflowStepKeys = {
  merchandiser: [
    'workflows.merchandiser.steps.createInspection',
    'workflows.merchandiser.steps.uploadBefore',
    'workflows.merchandiser.steps.submitToSupervisor',
    'workflows.merchandiser.steps.viewSupervisorMarkup',
    'workflows.merchandiser.steps.uploadAfterFix',
  ],
  supervisor: [
    'workflows.supervisor.steps.openInspections',
    'workflows.supervisor.steps.reviewPhotos',
    'workflows.supervisor.steps.addViolationMarks',
    'workflows.supervisor.steps.requestCorrection',
    'workflows.supervisor.steps.acceptCorrection',
  ],
  admin: [
    'workflows.admin.steps.manageConfigs',
    'workflows.admin.steps.checkMerchScenario',
    'workflows.admin.steps.checkSupervisorScenario',
    'workflows.admin.steps.exportPackages',
    'workflows.admin.steps.prepareDemo',
  ],
  viewer: [
    'workflows.viewer.steps.viewInspections',
    'workflows.viewer.steps.viewMarkup',
    'workflows.viewer.steps.exportAvailableData',
  ],
} as const satisfies Record<UserRole, readonly string[]>;

const quickActions = [
  {
    to: '/inspections',
    labelKey: 'quickActions.inspections.title',
    descriptionKey: 'quickActions.inspections.description',
    permission: 'inspection:view',
  },
  {
    to: '/annotator',
    labelKey: 'quickActions.annotator.title',
    descriptionKey: 'quickActions.annotator.description',
    permission: 'annotation:view',
  },
  {
    to: '/config-manager',
    labelKey: 'quickActions.configs.title',
    descriptionKey: 'quickActions.configs.description',
    permission: 'config:manage',
  },
  {
    to: '/export',
    labelKey: 'quickActions.export.title',
    descriptionKey: 'quickActions.export.description',
    permission: 'export:create',
  },
] as const satisfies readonly {
  to: string;
  labelKey: string;
  descriptionKey: string;
  permission: Permission;
}[];

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const currentUser = useAuthStore((state) => state.currentUser);

  const role = currentUser?.role ?? 'viewer';
  const visibleQuickActions = quickActions.filter((action) =>
    can(currentUser, action.permission),
  );

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

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
              <ShieldCheck size={16} />
              {t('workflows.currentRole', {
                role: t(`roles.${role}`, { ns: 'common' }),
              })}
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              {t(`workflows.${role}.title`)}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              {t(`workflows.${role}.description`)}
            </p>
          </div>

          {currentUser ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm">
              <div className="text-slate-500">{t('workflows.user')}</div>
              <div className="mt-1 font-medium text-slate-100">{currentUser.name}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {roleWorkflowStepKeys[role].map((stepKey, index) => (
            <div key={stepKey} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="text-xs font-medium text-slate-500">
                {t('workflows.step', { number: index + 1 })}
              </div>
              <div className="mt-2 text-sm text-slate-200">{t(stepKey)}</div>
            </div>
          ))}
        </div>
      </div>

      {visibleQuickActions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleQuickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-600 hover:bg-slate-900"
            >
              <h2 className="text-lg font-semibold">{t(action.labelKey)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {t(action.descriptionKey)}
              </p>
            </Link>
          ))}
        </div>
      ) : null}

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
