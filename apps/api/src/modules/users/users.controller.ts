/**
 * FILE PURPOSE:
 * Express controller handlers for administrative user management operations.
 *
 * MAIN RESPONSIBILITY:
 * Provides handlers for listing users with pagination and role filtering, and toggling
 * account active/inactive status with self-deactivation protection and activity logging.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/users/users.routes.ts (Route layer caller)
 * - apps/api/src/modules/users/user.repository.ts (User data access)
 * - apps/api/src/modules/activity/activity.service.ts (Audit trail logging)
 */

import type { Request, Response } from 'express';
import { asyncHandler, buildMeta, ok, parsePagination } from '../../lib/http';
import { ApiError } from '../../lib/errors';
import { userRepository } from './user.repository';
import { activityService } from '../activity/activity.service';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const params = parsePagination(req);
  const roleFilter = req.query.role === 'admin' || req.query.role === 'user'
    ? { role: req.query.role }
    : {};
  const { items, total } = await userRepository.paginate(params, roleFilter);
  ok(res, items.map((u) => u.toJSON()), buildMeta(params.page, params.limit, total));
});

export const setUserActive = asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepository.findById(req.params.id!);
  if (!user) throw ApiError.notFound('User');
  if (user.id === req.auth!.userId) throw ApiError.badRequest('You cannot deactivate yourself');

  user.isActive = Boolean(req.body.isActive);
  await user.save();
  await activityService.log(
    req.auth!.userId,
    'admin',
    user.isActive ? 'user.activate' : 'user.deactivate',
    'user',
    user.id,
  );
  ok(res, user.toJSON());
});
