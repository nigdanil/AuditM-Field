import type { AuthUser, Permission, UserRole } from '../../entities/user/types';

export const allPermissions: Permission[] = [
  'inspection:create',
  'inspection:view',
  'inspection:submit',
  'inspection:review',
  'photo:add',
  'photo:correct',
  'annotation:view',
  'annotation:create',
  'annotation:review',
  'correction:request',
  'correction:upload',
  'review:approve',
  'export:create',
  'config:manage',
  'settings:manage',
];

export const rolePermissions: Record<UserRole, Permission[]> = {
  merchandiser: [
    'inspection:create',
    'inspection:view',
    'inspection:submit',
    'photo:add',
    'photo:correct',
    'annotation:view',
    'correction:upload',
    'export:create',
  ],

  supervisor: [
    'inspection:view',
    'inspection:review',
    'annotation:view',
    'annotation:create',
    'annotation:review',
    'correction:request',
    'review:approve',
    'export:create',
  ],

  admin: allPermissions,

  viewer: ['inspection:view', 'annotation:view', 'export:create'],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function can(user: AuthUser | null | undefined, permission: Permission): boolean {
  if (!user) {
    return false;
  }

  return hasPermission(user.role, permission);
}
