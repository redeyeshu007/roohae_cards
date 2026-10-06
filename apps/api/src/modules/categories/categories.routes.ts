/**
 * FILE PURPOSE:
 * Express route declarations for category browsing and administrative CRUD.
 *
 * MAIN RESPONSIBILITY:
 * Exposes GET / (browse active categories with pagination), GET /:id,
 * and admin-guarded POST, PATCH, and DELETE operations for category maintenance.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/routes.ts (mounts categoriesRoutes at /api/v1/categories)
 * - apps/api/src/modules/categories/categories.service.ts (business logic)
 * - apps/admin & apps/user (category dropdowns and filters)
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { createCategorySchema, updateCategorySchema } from '@roohae/shared';
import { requireAdmin, requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler, buildMeta, ok, parsePagination } from '../../lib/http';
import { categoriesService } from './categories.service';

export const categoriesRoutes = Router();


// Any authenticated user can browse active categories (template gallery filters).
categoriesRoutes.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const params = parsePagination(req, 'name');
    const activeOnly = req.auth!.role !== 'admin' || req.query.active === 'true';
    const { items, total } = await categoriesService.paginate(params, activeOnly);
    ok(res, items, buildMeta(params.page, params.limit, total));
  }),
);

categoriesRoutes.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    ok(res, await categoriesService.getById(req.params.id!));
  }),
);

categoriesRoutes.post(
  '/',
  ...requireAdmin,
  validate(createCategorySchema),
  asyncHandler(async (req: Request, res: Response) => {
    ok(res, await categoriesService.create(req.auth!.userId, req.body));
  }),
);

categoriesRoutes.patch(
  '/:id',
  ...requireAdmin,
  validate(updateCategorySchema),
  asyncHandler(async (req: Request, res: Response) => {
    ok(res, await categoriesService.update(req.auth!.userId, req.params.id!, req.body));
  }),
);

categoriesRoutes.delete(
  '/:id',
  ...requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    await categoriesService.remove(req.auth!.userId, req.params.id!);
    ok(res, { deleted: true });
  }),
);
