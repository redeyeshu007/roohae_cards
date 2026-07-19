'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, User } from '@roohae/shared';

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  /** True once persisted state has been rehydrated — gate route guards on this. */
  hydrated: boolean;
  setSession: (user: User, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
  clear: () => void;
}

export type AuthStore = ReturnType<typeof createAuthStore>;

/**
 * Each app creates its own persisted auth store under a distinct key so an
 * admin and a user session can coexist in one browser.
 */
export function createAuthStore(storageKey: string): ReturnType<typeof buildStore> {
  return buildStore(storageKey);
}

function buildStore(storageKey: string) {
  return create<AuthState>()(
    persist(
      (set) => ({
        user: null,
        tokens: null,
        hydrated: false,
        setSession: (user, tokens) => set({ user, tokens }),
        setTokens: (tokens) => set({ tokens }),
        setUser: (user) => set({ user }),
        setHydrated: () => set({ hydrated: true }),
        clear: () => set({ user: null, tokens: null }),
      }),
      {
        name: storageKey,
        partialize: (s) => ({ user: s.user, tokens: s.tokens }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated();
        },
      },
    ),
  );
}
