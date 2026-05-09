import type { ExportJobAdapterId } from '../../../entities/export-job/types';

const STORAGE_ADAPTER_SETTINGS_KEY = 'auditm-field.storage-adapter-settings';

export type StorageAdapterSettings = {
  adapterId: ExportJobAdapterId;
  httpUploadUrl: string;
  webhookUrl: string;
};

export const defaultStorageAdapterSettings: StorageAdapterSettings = {
  adapterId: 'local-download',
  httpUploadUrl: '',
  webhookUrl: '',
};

export function loadStorageAdapterSettings(): StorageAdapterSettings {
  const rawValue = localStorage.getItem(STORAGE_ADAPTER_SETTINGS_KEY);

  if (!rawValue) {
    return defaultStorageAdapterSettings;
  }

  try {
    return {
      ...defaultStorageAdapterSettings,
      ...(JSON.parse(rawValue) as Partial<StorageAdapterSettings>),
    };
  } catch {
    localStorage.removeItem(STORAGE_ADAPTER_SETTINGS_KEY);

    return defaultStorageAdapterSettings;
  }
}

export function saveStorageAdapterSettings(
  settings: StorageAdapterSettings,
): StorageAdapterSettings {
  localStorage.setItem(STORAGE_ADAPTER_SETTINGS_KEY, JSON.stringify(settings));

  return settings;
}

export function getStorageAdapterTargetUrl(settings: StorageAdapterSettings): string | undefined {
  if (settings.adapterId === 'http-upload') {
    return settings.httpUploadUrl.trim() || undefined;
  }

  if (settings.adapterId === 'webhook') {
    return settings.webhookUrl.trim() || undefined;
  }

  return undefined;
}
