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
