/**
 * FILE PURPOSE:
 * Express route declarations for typography font catalog and administrative font uploads.
 *
 * MAIN RESPONSIBILITY:
 * Exposes GET / (retrieves active fonts for canvas rendering), multipart POST / (uploads up to 8 font weight files),
 * PATCH /:id/active (toggle availability), and DELETE /:id.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/routes.ts (mounts fontsRoutes at /api/v1/fonts)
 * - apps/api/src/modules/fonts/fonts.service.ts (business logic)
 * - packages/editor-sdk/src/fonts.ts (loads returned font faces into the browser)
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../../middlewares/auth.middleware';
import { fontUpload } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler, created, ok } from '../../lib/http';
import { ApiError } from '../../lib/errors';
import { fontsService } from './fonts.service';

export const fontsRoutes = Router();


// Users need active fonts to render text in their projects.
fontsRoutes.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const activeOnly = req.auth!.role !== 'admin' || req.query.active === 'true';
    ok(res, await fontsService.list(activeOnly));
  }),
);

fontsRoutes.post(
  '/',
  ...requireAdmin,
  fontUpload.array('files', 8),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw ApiError.badRequest('No font files uploaded');
    const family = typeof req.body.family === 'string' ? req.body.family.trim() : '';
    if (family.length < 2) throw ApiError.badRequest('Font family name is required');
    created(res, await fontsService.upload(req.auth!.userId, family, files));
  }),
);

fontsRoutes.patch(
  '/:id/active',
  ...requireAdmin,
  validate(z.object({ isActive: z.boolean() })),
  asyncHandler(async (req: Request, res: Response) => {
    ok(res, await fontsService.setActive(req.auth!.userId, req.params.id!, req.body.isActive));
  }),
);

fontsRoutes.delete(
  '/:id',
  ...requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    await fontsService.remove(req.auth!.userId, req.params.id!);
    ok(res, { deleted: true });
  }),
);
