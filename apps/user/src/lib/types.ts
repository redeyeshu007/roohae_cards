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
