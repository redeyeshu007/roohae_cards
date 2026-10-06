/**
 * FILE PURPOSE:
 * JWT signing and verification cryptography routines.
 *
 * MAIN RESPONSIBILITY:
 * Signs short-lived access tokens (15m TTL) and rotating refresh tokens (30d TTL),
 * and validates token signatures, expiration dates, and tokenVersion revocation state.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/auth/auth.service.ts (generates tokens on login/register/refresh)
 * - apps/api/src/middlewares/auth.middleware.ts (verifies access tokens on protected routes)
 */

import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@roohae/shared';
import { env } from '../config/env';
import { ApiError } from './errors';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  permissions: string[];
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  role: Role;
  type: 'refresh';
  /** Token version — bump on the user record to invalidate all refresh tokens. */
  tv: number;
}

export function signAccessToken(userId: string, email: string, role: Role, permissions: string[]): string {
  const payload: AccessTokenPayload = { sub: userId, email, role, permissions, type: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);
}

export function signRefreshToken(userId: string, role: Role, tokenVersion: number): string {
  const payload: RefreshTokenPayload = { sub: userId, role, type: 'refresh', tv: tokenVersion };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (payload.type !== 'access') throw new Error('wrong token type');
    return payload;
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (payload.type !== 'refresh') throw new Error('wrong token type');
    return payload;
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
}
