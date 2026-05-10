import { createBrowserRouter, Navigate } from 'react-router';

import { ConfigManagerPage } from '../pages/config-manager/ConfigManagerPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ExportCenterPage } from '../pages/export-center/ExportCenterPage';
import { InspectionDetailPage } from '../pages/inspection-detail/InspectionDetailPage';
import { InspectionsListPage } from '../pages/inspections-list/InspectionsListPage';
import { PhotoAnnotatorEntryPage } from '../pages/photo-annotator/PhotoAnnotatorEntryPage';
import { PhotoAnnotatorPage } from '../pages/photo-annotator/PhotoAnnotatorPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { AppLayout } from '../widgets/app-layout/AppLayout';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: 'dashboard',
          element: <DashboardPage />,
        },
        {
          path: 'config-manager',
          element: <ConfigManagerPage />,
        },
        {
          path: 'inspections',
          element: <InspectionsListPage />,
        },
        {
          path: 'inspections/:inspectionId',
          element: <InspectionDetailPage />,
        },
        {
          path: 'annotator',
          element: <PhotoAnnotatorEntryPage />,
        },
        {
          path: 'photos/:photoId/annotate',
          element: <PhotoAnnotatorPage />,
        },
        {
          path: 'export',
          element: <ExportCenterPage />,
        },
        {
          path: 'settings',
          element: <SettingsPage />,
        },
        {
          path: '*',
          element: <Navigate to="/dashboard" replace />,
        },
      ],
    },
  ],
  {
    basename: routerBasename || undefined,
  },
);
