import { NavLink, useNavigate } from 'react-router';
import {
  ClipboardCheck,
  Database,
  FileArchive,
  Home,
  ImagePlus,
  LogOut,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Permission } from '../../entities/user/types';
import { LanguageSwitcher } from '../../features/language-switcher/LanguageSwitcher';
import { useAuthStore } from '../../features/auth/authStore';
import { can } from '../../features/auth/permissions';

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
  permission?: Permission;
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
    permission: 'config:manage',
  },
  {
    to: '/inspections',
    labelKey: 'nav.inspections',
    icon: ClipboardCheck,
    permission: 'inspection:view',
  },
  {
    to: '/annotator',
    labelKey: 'nav.annotator',
    icon: ImagePlus,
    permission: 'annotation:view',
  },
  {
    to: '/export',
    labelKey: 'nav.export',
    icon: FileArchive,
    permission: 'export:create',
  },
  {
    to: '/settings',
    labelKey: 'nav.settings',
    icon: Settings,
    permission: 'settings:manage',
  },
];

export function AppHeader() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);

  const visibleNavItems = navItems.filter(
    (item) => !item.permission || can(currentUser, item.permission),
  );

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight">{t('app.name')}</div>
          <div className="text-sm text-slate-400">{t('app.subtitle')}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-2">
            {visibleNavItems.map((item) => {
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

          {currentUser ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
              <UserRound size={16} />
              <span>{currentUser.name}</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {t(`roles.${currentUser.role}`)}
              </span>
            </div>
          ) : null}

          <LanguageSwitcher />

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={16} />
            {t('actions.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
