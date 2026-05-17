import { create } from 'zustand';

import type { AuthUser, LoginCredentials } from '../../entities/user/types';
import { mockUsers } from './mockUsers';

const AUTH_STORAGE_KEY = 'auditm-field.auth.user';

type AuthStore = {
  currentUser: AuthUser | null;
  login: (credentials: LoginCredentials) => boolean;
  loginAsDemo: (userId: string) => boolean;
  logout: () => void;
};

function toAuthUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
  };
}

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const user = JSON.parse(raw) as Partial<AuthUser>;

    if (!user.id || !user.name || !user.role) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      role: user.role,
    } as AuthUser;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: readStoredUser(),

  login: (credentials) => {
    const normalizedLogin = credentials.login.trim().toLowerCase();

    const user = mockUsers.find(
      (mockUser) =>
        mockUser.login.toLowerCase() === normalizedLogin &&
        mockUser.password === credentials.password,
    );

    if (!user) {
      return false;
    }

    const currentUser = toAuthUser(user);

    writeStoredUser(currentUser);
    set({ currentUser });

    return true;
  },

  loginAsDemo: (userId) => {
    const user = mockUsers.find((mockUser) => mockUser.id === userId);

    if (!user) {
      return false;
    }

    const currentUser = toAuthUser(user);

    writeStoredUser(currentUser);
    set({ currentUser });

    return true;
  },

  logout: () => {
    writeStoredUser(null);
    set({ currentUser: null });
  },
}));
