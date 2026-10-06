/**
 * FILE PURPOSE:
 * Authentication HTTP route definitions.
 *
 * MAIN RESPONSIBILITY:
 * Defines REST endpoints for registration, login, token refresh, current user profile fetching,
 * profile updates, and password changes, with rate limiting and schema validation.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/routes.ts (mounts authRoutes at /api/v1/auth)
 * - apps/api/src/modules/auth/auth.controller.ts (dispatches requests to controller methods)
 * - packages/shared/src/schemas/auth.schema.ts (Zod request validation schemas)
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema,
} from '@roohae/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as controller from './auth.controller';


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export const authRoutes = Router();

authRoutes.post('/register', authLimiter, validate(registerSchema), controller.register);
authRoutes.post('/login', authLimiter, validate(loginSchema), controller.login);

authRoutes.post('/refresh', validate(refreshSchema), controller.refresh);
authRoutes.get('/me', requireAuth, controller.me);
authRoutes.patch('/profile', requireAuth, validate(updateProfileSchema), controller.updateProfile);
authRoutes.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  controller.changePassword,
);
