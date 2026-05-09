import { NavLink } from 'react-router';
import {
  ClipboardCheck,
  Database,
  FileArchive,
  Home,
  ImagePlus,
  Settings,
} from 'lucide-react';

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: Home,
  },
  {
    to: '/config-manager',
    label: 'Configs',
    icon: Database,
  },
  {
    to: '/inspections',
    label: 'Inspections',
    icon: ClipboardCheck,
  },
  {
    to: '/annotator',
    label: 'Annotator',
    icon: ImagePlus,
  },
  {
    to: '/export',
    label: 'Export',
    icon: FileArchive,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function AppHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight">AuditM-Field</div>
          <div className="text-sm text-slate-400">
            Configurable PWA for field photo audits and image annotation
          </div>
        </div>

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
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
