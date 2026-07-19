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
