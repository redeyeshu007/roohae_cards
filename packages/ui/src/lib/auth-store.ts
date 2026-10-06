'use client';

/**
 * FILE PURPOSE:
 * Factory for persisted client authentication Zustand stores.
 *
 * MAIN RESPONSIBILITY:
 * Manages user session state, JWT tokens (access + refresh), hydration state,
 * and localStorage persistence under isolated namespace keys (admin vs user).
 *
 * CONNECTED SYSTEMS:
 * - apps/admin/src/lib/api.ts (uses roohae_admin_auth storage key)
 * - apps/user/src/lib/api.ts (uses roohae_user_auth storage key)
 * - apps/admin & apps/user login pages (calls setSession on successful auth)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, User } from '@roohae/shared';

// AUTHENTICATION STATE:
// Defines client-side authentication model, tokens, and mutations.
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
// ZUSTAND AUTH STORE FACTORY:
// Instantiates a typed Zustand store with localStorage persistence and hydration callbacks.
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
