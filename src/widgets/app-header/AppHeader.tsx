import { NavLink } from 'react-router';
import {
  ClipboardCheck,
  Database,
  FileArchive,
  Home,
  ImagePlus,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '../../features/language-switcher/LanguageSwitcher';

type NavItem = {
  to: string;
  labelKey:
    | 'nav.dashboard'
    | 'nav.configs'
    | 'nav.inspections'
    | 'nav.annotator'
    | 'nav.export'
    | 'nav.settings';
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: Home,
  },
  {
    to: '/config-manager',
    labelKey: 'nav.configs',
    icon: Database,
  },
  {
    to: '/inspections',
    labelKey: 'nav.inspections',
    icon: ClipboardCheck,
  },
  {
    to: '/annotator',
    labelKey: 'nav.annotator',
    icon: ImagePlus,
  },
  {
    to: '/export',
    labelKey: 'nav.export',
    icon: FileArchive,
  },
  {
    to: '/settings',
    labelKey: 'nav.settings',
    icon: Settings,
  },
];

export function AppHeader() {
  const { t } = useTranslation('common');

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight">{t('app.name')}</div>
          <div className="text-sm text-slate-400">{t('app.subtitle')}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                      isActive
                        ? 'bg-slate-100 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white',
                    ].join(' ')
                  }
                >
                  <Icon size={16} />
                  {t(item.labelKey)}
                </NavLink>
              );
            })}
          </nav>

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
