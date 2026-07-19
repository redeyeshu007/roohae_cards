import axios, { AxiosError, type AxiosInstance } from 'axios';
import type { ApiFailure, AuthTokens } from '@roohae/shared';

export interface TokenStore {
  getTokens(): AuthTokens | null;
  setTokens(tokens: AuthTokens | null): void;
  onSessionExpired(): void;
}

/**
 * Axios client with automatic access-token injection and single-flight
 * refresh-token rotation on 401.
 */
export function createApiClient(baseURL: string, store: TokenStore): AxiosInstance {
  const client = axios.create({ baseURL: `${baseURL.replace(/\/$/, '')}/api/v1` });

  client.interceptors.request.use((config) => {
    const tokens = store.getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  });

  let refreshing: Promise<AuthTokens | null> | null = null;

  async function refreshTokens(): Promise<AuthTokens | null> {
    const tokens = store.getTokens();
    if (!tokens?.refreshToken) return null;
    try {
      const { data } = await axios.post<{ success: true; data: { tokens: AuthTokens } }>(
        `${baseURL.replace(/\/$/, '')}/api/v1/auth/refresh`,
        { refreshToken: tokens.refreshToken },
      );
      store.setTokens(data.data.tokens);
      return data.data.tokens;
    } catch {
      store.setTokens(null);
      store.onSessionExpired();
      return null;
    }
  }

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config;
      const status = error.response?.status;
      if (status === 401 && original && !(original as { _retried?: boolean })._retried) {
        (original as { _retried?: boolean })._retried = true;
        refreshing ??= refreshTokens().finally(() => {
          refreshing = null;
        });
        const tokens = await refreshing;
        if (tokens) {
          original.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return client(original);
        }
      }
      throw error;
    },
  );

  return client;
}

/** Extract a human-readable message from any API error. */
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiFailure | undefined;
    if (body && body.success === false) {
      const details = body.error.details;
      if (Array.isArray(details) && details.length > 0) {
        const first = details[0] as { message?: string };
        if (first?.message) return first.message;
      }
      return body.error.message;
    }
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the API running?';
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}

/** Unwrap the standard `{ success, data, meta }` envelope. */
export function unwrap<T>(payload: { data: { success: true; data: T } }): T {
  return payload.data.data;
}
