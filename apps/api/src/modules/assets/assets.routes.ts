/**
 * FILE PURPOSE:
 * Express route definitions for asset management, uploads, and runtime resolution.
 *
 * MAIN RESPONSIBILITY:
 * Exposes endpoints for paginating library assets (admin), querying user uploads (/mine),
 * resolving referenced asset IDs to loadable URLs (/resolve), and handling multipart uploads.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/routes.ts (mounts assetsRoutes at /api/v1/assets)
 * - apps/api/src/modules/assets/assets.service.ts (business logic)
 * - apps/admin & apps/user (Uploads panel and runtime asset resolution)
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../../middlewares/auth.middleware';
import { assetUpload, replacementUpload } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler, buildMeta, created, ok, parsePagination } from '../../lib/http';
import { ApiError } from '../../lib/errors';
import { assetsService } from './assets.service';

export const assetsRoutes = Router();


/**
 * The global Asset Library (Uploads panel). ADMIN ONLY — end users never
 * browse the admin library; their projects resolve referenced assets through
 * the scoped /resolve endpoint instead. The service layer additionally
 * hard-scopes this listing to library assets (no user/system files).
 */
assetsRoutes.get(
  '/',
  ...requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const params = parsePagination(req);
    const { items, total } = await assetsService.paginate(params, {
      kind: typeof req.query.kind === 'string' ? req.query.kind : undefined,
      folder: typeof req.query.folder === 'string' ? req.query.folder : undefined,
    });
    ok(res, items, buildMeta(params.page, params.limit, total));
  }),
);

/** A user's own replacement uploads. */
assetsRoutes.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const params = parsePagination(req);
    const { items, total } = await assetsService.listOwned(req.auth!.userId, params);
    ok(res, items, buildMeta(params.page, params.limit, total));
  }),
);

/**
 * Resolve assetIds referenced by a design document to original-asset URLs.
 * Admins resolve anything; users are scoped to their own project + uploads.
 */
assetsRoutes.post(
  '/resolve',
  requireAuth,
  validate(
    z.object({
      ids: z.array(z.string()).max(500),
      projectId: z.string().optional(),
      templateId: z.string().optional(),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    if (req.auth!.role === 'admin') {
      ok(res, await assetsService.getMany(req.body.ids));
      return;
    }
    ok(
      res,
      await assetsService.resolveForUser(req.auth!.userId, req.body.ids, {
        projectId: req.body.projectId,
        templateId: req.body.templateId,
      }),
    );
  }),
);

/** Admin library upload — users never bring assets into the shared library. */
assetsRoutes.post(
  '/',
  ...requireAdmin,
  assetUpload.array('files', 20),
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw ApiError.badRequest('No files uploaded');
    const tags = typeof req.body.tags === 'string'
      ? req.body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];
    const folder = typeof req.body.folder === 'string' && req.body.folder ? req.body.folder : undefined;

    const results = [];
    for (const file of files) {
      results.push(await assetsService.upload(req.auth!.userId, file, { tags, folder }));
    }
    created(res, results);
  }),
);

/**
 * End-user replacement image upload. The file becomes PRIVATE asset(s) owned
 * by the user, used only to fill editable placeholders in their projects.
 * Always responds with an array.
 * The original bytes are stored untouched; thumbnails are derived separately.
 */
assetsRoutes.post(
  '/replacements',
  requireAuth,
  replacementUpload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) throw ApiError.badRequest('No file uploaded');

    const options = {
      folder: 'user-replacements',
      actorRole: req.auth!.role,
      // Private to this user — never part of the global library.
      scope: 'user' as const,
    };

    created(res, [await assetsService.upload(req.auth!.userId, file, options)]);
  }),
);

assetsRoutes.delete(
  '/:id',
  ...requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    await assetsService.remove(req.auth!.userId, req.params.id!);
    ok(res, { deleted: true });
  }),
);
