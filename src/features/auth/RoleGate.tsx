import type { ReactNode } from 'react';

import type { Permission } from '../../entities/user/types';
import { useAuthStore } from './authStore';
import { can } from './permissions';

type RoleGateProps = {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
};

export function RoleGate({ permission, children, fallback = null }: RoleGateProps) {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!can(currentUser, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
