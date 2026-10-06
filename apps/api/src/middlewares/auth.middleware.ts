/**
 * FILE PURPOSE:
 * JWT authentication and role-based access control (RBAC) middleware.
 *
 * MAIN RESPONSIBILITY:
 * Extracts Bearer tokens from incoming Authorization headers, verifies validity with verifyAccessToken,
 * attaches auth user payload to Express req, and provides requireRole / requireAdmin gates.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/* (*.routes.ts gates admin and protected user endpoints with requireAuth/requireAdmin)
 * - apps/api/src/lib/tokens.ts (token verification routines)
 */

import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@roohae/shared';
import { ApiError } from '../lib/errors';
import { verifyAccessToken } from '../lib/tokens';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role };
    }
  }
}

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

/** Require a valid access token. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(ApiError.unauthorized());
    return;
  }
  const payload = verifyAccessToken(token);
  req.auth = { userId: payload.sub, role: payload.role };
  next();
}

/** Require one of the given roles. Use after requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
}

export const requireAdmin = [requireAuth, requireRole('admin')] as const;
