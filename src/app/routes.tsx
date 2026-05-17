import { createBrowserRouter, Navigate } from 'react-router';

import { ConfigManagerPage } from '../pages/config-manager/ConfigManagerPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ExportCenterPage } from '../pages/export-center/ExportCenterPage';
import { InspectionDetailPage } from '../pages/inspection-detail/InspectionDetailPage';
import { InspectionsListPage } from '../pages/inspections-list/InspectionsListPage';
import { LoginPage } from '../pages/login/LoginPage';
import { PhotoAnnotatorEntryPage } from '../pages/photo-annotator/PhotoAnnotatorEntryPage';
import { PhotoAnnotatorPage } from '../pages/photo-annotator/PhotoAnnotatorPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { RequireAuth } from '../features/auth/RequireAuth';
import { RequirePermission } from '../features/auth/RequirePermission';
import { AppLayout } from '../widgets/app-layout/AppLayout';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/',
      element: (
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      ),
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
          element: (
            <RequirePermission permission="config:manage">
              <ConfigManagerPage />
            </RequirePermission>
          ),
        },
        {
          path: 'inspections',
          element: (
            <RequirePermission permission="inspection:view">
              <InspectionsListPage />
            </RequirePermission>
          ),
        },
        {
          path: 'inspections/:inspectionId',
          element: (
            <RequirePermission permission="inspection:view">
              <InspectionDetailPage />
            </RequirePermission>
          ),
        },
        {
          path: 'annotator',
          element: (
            <RequirePermission permission="annotation:view">
              <PhotoAnnotatorEntryPage />
            </RequirePermission>
          ),
        },
        {
          path: 'photos/:photoId/annotate',
          element: (
            <RequirePermission permission="annotation:view">
              <PhotoAnnotatorPage />
            </RequirePermission>
          ),
        },
        {
          path: 'export',
          element: (
            <RequirePermission permission="export:create">
              <ExportCenterPage />
            </RequirePermission>
          ),
        },
        {
          path: 'settings',
          element: (
            <RequirePermission permission="settings:manage">
              <SettingsPage />
            </RequirePermission>
          ),
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
