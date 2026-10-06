/**
 * FILE PURPOSE:
 * Type definitions for API request and response envelopes across Roohae.
 *
 * MAIN RESPONSIBILITY:
 * Defines standard envelope contracts: ApiSuccess, ApiFailure, ApiResponse,
 * pagination parameters, JWT token payloads, and admin dashboard statistics.
 *
 * CONNECTED SYSTEMS:
 * - apps/api (serializes JSON responses matching ApiSuccess / ApiFailure)
 * - packages/ui & apps (deserializes typed Axios/fetch API responses)
 */

/** Standard API envelope returned by every endpoint. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthPayload {
  user: import('./entities').User;
  tokens: AuthTokens;
}

export interface DashboardStats {
  users: number;
  templates: number;
  publishedTemplates: number;
  categories: number;
  assets: number;
  fonts: number;
  projects: number;
  recentActivity: import('./entities').ActivityLog[];
}
