/**
 * FILE PURPOSE:
 * Administrative frontend API client configuration and authentication store initialization.
 *
 * MAIN RESPONSIBILITY:
 * Configures the Axios-based API client with JWT interceptors, base URL from environment,
 * persistent admin token storage in localStorage ('roohae-admin-auth'), and session expiry redirect.
 *
 * CONNECTED SYSTEMS:
 * - packages/ui/src/lib/api.ts (createApiClient)
 * - packages/ui/src/lib/auth-store.ts (createAuthStore)
 * - apps/api (backend HTTP endpoints at API_BASE_URL)
 */

'use client';

import { createApiClient, createAuthStore } from '@roohae/ui';

// ENVIRONMENT CONFIG:
// Target backend API base URL with fallback to local development port 4000.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// AUTH STORE:
// Zustand store persisting admin credentials under localStorage key 'roohae-admin-auth'.
export const useAuthStore = createAuthStore('roohae-admin-auth');

export const api = createApiClient(API_BASE_URL, {
  getTokens: () => useAuthStore.getState().tokens,
  setTokens: (tokens) => useAuthStore.getState().setTokens(tokens),
  onSessionExpired: () => {
    useAuthStore.getState().clear();
    if (typeof window !== 'undefined') window.location.href = '/login';
  },
});
