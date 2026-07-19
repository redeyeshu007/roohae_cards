import { Router } from 'express';
import type { Request, Response } from 'express';
import { createProjectSchema, updateProjectSchema } from '@roohae/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler, buildMeta, created, ok, parsePagination } from '../../lib/http';
import { projectsService } from './projects.service';

export const projectsRoutes = Router();

projectsRoutes.use(requireAuth);

projectsRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const params = parsePagination(req, '-lastEditedAt');
    const { items, total } = await projectsService.paginate(req.auth!.userId, params);
    ok(res, items, buildMeta(params.page, params.limit, total));
  }),
);

projectsRoutes.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.getOwned(req.auth!.userId, req.params.id!);
    ok(res, project.toJSON());
  }),
);

projectsRoutes.post(
  '/',
  validate(createProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    created(res, await projectsService.createFromTemplate(req.auth!.userId, req.body));
  }),
);

projectsRoutes.patch(
  '/:id',
  validate(updateProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    ok(res, await projectsService.update(req.auth!.userId, req.params.id!, req.body));
  }),
);

projectsRoutes.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await projectsService.remove(req.auth!.userId, req.params.id!);
    ok(res, { deleted: true });
  }),
);
