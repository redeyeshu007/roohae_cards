/**
 * FILE PURPOSE:
 * End-user client API network configuration and authentication store initialization.
 *
 * MAIN RESPONSIBILITY:
 * Sets up the Axios API client configured with user token refresh interceptors,
 * user authentication persistence in localStorage ('roohae-user-auth'), and session expiry redirect.
 *
 * CONNECTED SYSTEMS:
 * - packages/ui/src/lib/api.ts (createApiClient)
 * - packages/ui/src/lib/auth-store.ts (createAuthStore)
 * - apps/api (HTTP backend server)
 */

'use client';

import { createApiClient, createAuthStore } from '@roohae/ui';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const useAuthStore = createAuthStore('roohae-user-auth');

export const api = createApiClient(API_BASE_URL, {
  getTokens: () => useAuthStore.getState().tokens,
  setTokens: (tokens) => useAuthStore.getState().setTokens(tokens),
  onSessionExpired: () => {
    useAuthStore.getState().clear();
    if (typeof window !== 'undefined') window.location.href = '/login';
  },
});
