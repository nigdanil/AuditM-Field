import type { ActiveConfigState, AuditConfig, ConfigLoadSource } from './types';

const ACTIVE_CONFIG_STORAGE_KEY = 'auditm-field.active-config';

export function saveActiveConfig(config: AuditConfig, source: ConfigLoadSource): ActiveConfigState {
  const state: ActiveConfigState = {
    config,
    source,
    loadedAt: new Date().toISOString(),
  };

  localStorage.setItem(ACTIVE_CONFIG_STORAGE_KEY, JSON.stringify(state));

  return state;
}

export function loadActiveConfig(): ActiveConfigState | null {
  const rawValue = localStorage.getItem(ACTIVE_CONFIG_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as ActiveConfigState;
  } catch {
    localStorage.removeItem(ACTIVE_CONFIG_STORAGE_KEY);
    return null;
  }
}

export function clearActiveConfig(): void {
  localStorage.removeItem(ACTIVE_CONFIG_STORAGE_KEY);
}
