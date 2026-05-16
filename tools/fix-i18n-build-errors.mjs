import { readFileSync, writeFileSync } from 'node:fs';

function updateJson(filePath, statusLabels) {
  const json = JSON.parse(readFileSync(filePath, 'utf8'));

  json.status = {
    ...json.status,
    ...statusLabels,
  };

  writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
}

updateJson('src/shared/i18n/locales/en/inspections.json', {
  DRAFT: 'Draft',
  READY: 'Ready',
  EXPORTED: 'Exported',
  ARCHIVED: 'Archived',
  SYNC_PENDING: 'Sync pending',
  SYNCED: 'Synced',
  SYNC_FAILED: 'Sync failed',
});

updateJson('src/shared/i18n/locales/ru/inspections.json', {
  DRAFT: 'Черновик',
  READY: 'Готово',
  EXPORTED: 'Экспортировано',
  ARCHIVED: 'Архив',
  SYNC_PENDING: 'Ожидает синхронизации',
  SYNCED: 'Синхронизировано',
  SYNC_FAILED: 'Ошибка синхронизации',
});

let inspectionsPage = readFileSync('src/pages/inspections-list/InspectionsListPage.tsx', 'utf8');

inspectionsPage = inspectionsPage.replace(
  `  const inspectionStatusLabels: Record<InspectionStatus, string> = {
    DRAFT: t('status.DRAFT'),
    READY: t('status.READY'),
    EXPORTED: t('status.EXPORTED'),
    ARCHIVED: t('status.ARCHIVED'),
  };`,
  `  const inspectionStatusLabels: Record<InspectionStatus, string> = {
    DRAFT: t('status.DRAFT'),
    READY: t('status.READY'),
    EXPORTED: t('status.EXPORTED'),
    ARCHIVED: t('status.ARCHIVED'),
    SYNC_PENDING: t('status.SYNC_PENDING'),
    SYNCED: t('status.SYNCED'),
    SYNC_FAILED: t('status.SYNC_FAILED'),
  };`,
);

writeFileSync('src/pages/inspections-list/InspectionsListPage.tsx', inspectionsPage);
