import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import type { Permission } from '../../entities/user/types';
import { useAuthStore } from './authStore';
import { can } from './permissions';

type RequirePermissionProps = {
  permission: Permission;
  children: ReactNode;
};

export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!can(currentUser, permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
