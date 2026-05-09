import { Outlet } from 'react-router';

import { AppHeader } from '../app-header/AppHeader';
import { OfflineBanner } from '../offline-banner/OfflineBanner';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <OfflineBanner />
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
