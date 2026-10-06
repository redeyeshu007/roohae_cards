/**
 * FILE PURPOSE:
 * Express route declarations for template browsing, retrieval, creation, updating, and publishing.
 *
 * MAIN RESPONSIBILITY:
 * Exposes GET / (filtered for users to published templates; open to all statuses for admins),
 * GET /:id, and admin-protected POST /, PATCH /:id, PATCH /:id/status, and DELETE /:id.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/routes.ts (mounts templatesRoutes at /api/v1/templates)
 * - apps/api/src/modules/templates/templates.service.ts (business logic and asset extractors)
 * - apps/admin & apps/user template galleries and editor loaders
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  createTemplateSchema,
  updateTemplateSchema,
  updateTemplateStatusSchema,
} from '@roohae/shared';
import { requireAdmin, requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler, buildMeta, created, ok, parsePagination } from '../../lib/http';
import { templatesService } from './templates.service';

export const templatesRoutes = Router();

/**
 * Listing is shared: admins see every status; users only ever see published
 * templates (enforced server-side regardless of query params).
 */
templatesRoutes.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const params = parsePagination(req, '-updatedAt');
    const isAdmin = req.auth!.role === 'admin';
    const { items, total } = await templatesService.paginate(params, {
      publishedOnly: !isAdmin,
      status: isAdmin && typeof req.query.status === 'string' ? req.query.status : undefined,
      categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
    });
    ok(res, items, buildMeta(params.page, params.limit, total));
  }),
);

templatesRoutes.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const publishedOnly = req.auth!.role !== 'admin';
    const template = await templatesService.getById(req.params.id!, publishedOnly);
    ok(res, template.toJSON());
  }),
);

templatesRoutes.post(
  '/',
  ...requireAdmin,
  validate(createTemplateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    created(res, await templatesService.create(req.auth!.userId, req.body));
  }),
);


templatesRoutes.patch(
  '/:id',
  ...requireAdmin,
  validate(updateTemplateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    ok(res, await templatesService.update(req.auth!.userId, req.params.id!, req.body));
  }),
);

templatesRoutes.patch(
  '/:id/status',
  ...requireAdmin,
  validate(updateTemplateStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    ok(res, await templatesService.setStatus(req.auth!.userId, req.params.id!, req.body.status));
  }),
);

templatesRoutes.post(
  '/:id/duplicate',
  ...requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    created(res, await templatesService.duplicate(req.auth!.userId, req.params.id!));
  }),
);

templatesRoutes.delete(
  '/:id',
  ...requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    await templatesService.remove(req.auth!.userId, req.params.id!);
    ok(res, { deleted: true });
  }),
);
