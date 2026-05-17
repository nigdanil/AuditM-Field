import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';

import { useAuthStore } from '../../features/auth/authStore';
import { mockUsers } from '../../features/auth/mockUsers';

export function LoginPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = useAuthStore((state) => state.currentUser);
  const login = useAuthStore((state) => state.login);
  const loginAsDemo = useAuthStore((state) => state.loginAsDemo);

  const [loginValue, setLoginValue] = useState('merch');
  const [passwordValue, setPasswordValue] = useState('merch');
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const ok = login({
      login: loginValue,
      password: passwordValue,
    });

    if (!ok) {
      setError(t('login.errors.invalidCredentials'));
      return;
    }

    navigate(from, { replace: true });
  }

  function handleDemoLogin(userId: string) {
    const ok = loginAsDemo(userId);

    if (!ok) {
      setError(t('login.errors.demoUserNotFound'));
      return;
    }

    navigate('/dashboard', { replace: true });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
            <ShieldCheck size={16} />
            {t('login.badge')}
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-5xl">
            {t('login.title')}
          </h1>

          <p className="mt-4 max-w-2xl text-slate-400">{t('login.description')}</p>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {mockUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleDemoLogin(user.id)}
                className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-left transition hover:border-slate-500 hover:bg-slate-900"
              >
                <div className="mb-3 inline-flex rounded-xl bg-slate-800 p-2">
                  <UserRound size={18} />
                </div>

                <div className="font-medium">{user.name}</div>
                <div className="mt-1 text-sm text-slate-400">{t(`roles.${user.role}`)}</div>
                <div className="mt-3 text-xs text-slate-500">
                  {user.login} / {user.password}
                </div>
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
        >
          <div className="mb-6 inline-flex rounded-2xl bg-slate-800 p-3">
            <LockKeyhole size={24} />
          </div>

          <h2 className="text-2xl font-semibold">{t('login.form.title')}</h2>
          <p className="mt-2 text-sm text-slate-400">{t('login.form.description')}</p>

          <label className="mt-6 block">
            <span className="text-sm font-medium text-slate-300">{t('login.form.login')}</span>
            <input
              value={loginValue}
              onChange={(event) => setLoginValue(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-slate-400"
              placeholder="merch"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-300">{t('login.form.password')}</span>
            <input
              value={passwordValue}
              onChange={(event) => setPasswordValue(event.target.value)}
              type="password"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-slate-400"
              placeholder="merch"
            />
          </label>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-slate-100 px-4 py-2 font-medium text-slate-950 transition hover:bg-white"
          >
            {t('login.form.submit')}
          </button>
        </form>
      </section>
    </main>
  );
}
