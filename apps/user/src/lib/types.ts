/**
 * FILE PURPOSE:
 * Local TypeScript type definitions for user authentication payloads in the user application.
 *
 * MAIN RESPONSIBILITY:
 * Defines typed representations for LocalUser, LocalAuthPayload (user with access and refresh JWTs),
 * and LoginResponse API envelopes.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/app/login/page.tsx
 * - apps/user/src/app/register/page.tsx
 * - packages/shared
 */

import type { Role } from '@roohae/shared';

// TODO: Migrate these types to @roohae/shared when available
export interface LocalUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
  avatarUrl?: string;
}

export interface LocalAuthPayload {
  user: LocalUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  data: LocalAuthPayload;
}
