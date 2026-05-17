export type UserRole = 'merchandiser' | 'supervisor' | 'admin' | 'viewer';

export type Permission =
  | 'inspection:create'
  | 'inspection:view'
  | 'inspection:submit'
  | 'inspection:review'
  | 'photo:add'
  | 'photo:correct'
  | 'annotation:view'
  | 'annotation:create'
  | 'annotation:review'
  | 'correction:request'
  | 'correction:upload'
  | 'review:approve'
  | 'export:create'
  | 'config:manage'
  | 'settings:manage';

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
};

export type MockUser = AuthUser & {
  login: string;
  password: string;
};

export type LoginCredentials = {
  login: string;
  password: string;
};
