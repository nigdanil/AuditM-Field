import type { MockUser } from '../../entities/user/types';

export const mockUsers = [
  {
    id: 'u-merch-001',
    name: 'Demo Merchandiser',
    role: 'merchandiser',
    login: 'merch',
    password: 'merch',
  },
  {
    id: 'u-supervisor-001',
    name: 'Demo Supervisor',
    role: 'supervisor',
    login: 'supervisor',
    password: 'supervisor',
  },
  {
    id: 'u-admin-001',
    name: 'Demo Admin',
    role: 'admin',
    login: 'admin',
    password: 'admin',
  },
] as const satisfies readonly MockUser[];
