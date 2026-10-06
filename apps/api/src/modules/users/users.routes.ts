/**
 * FILE PURPOSE:
 * Express route declarations for administrative user account management.
 *
 * MAIN RESPONSIBILITY:
 * Exposes admin-guarded endpoints: GET / (list users) and PATCH /:id/active (activate/deactivate user).
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/routes.ts (mounts usersRoutes at /api/v1/users)
 * - apps/api/src/modules/users/users.controller.ts (controller action implementations)
 * - apps/admin/src/app/(panel)/users/page.tsx (Admin user management table)
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as controller from './users.controller';

export const usersRoutes = Router();

usersRoutes.use(...requireAdmin);
usersRoutes.get('/', controller.listUsers);
usersRoutes.patch(
  '/:id/active',
  validate(z.object({ isActive: z.boolean() })),
  controller.setUserActive,
);
