import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAdmin } from '../../middlewares/auth.middleware';
import { asyncHandler, buildMeta, ok, parsePagination } from '../../lib/http';
import { UserModel } from '../users/user.model';
import { TemplateModel } from '../templates/template.model';
import { CategoryModel } from '../categories/category.model';
import { AssetModel } from '../assets/asset.model';
import { FontModel } from '../fonts/font.model';
import { ProjectModel } from '../projects/project.model';
import { activityService } from '../activity/activity.service';

export const dashboardRoutes = Router();

dashboardRoutes.use(...requireAdmin);

dashboardRoutes.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const [users, templates, publishedTemplates, categories, assets, fonts, projects, recentActivity] =
      await Promise.all([
        UserModel.countDocuments({ role: 'user' }).exec(),
        TemplateModel.countDocuments().exec(),
        TemplateModel.countDocuments({ status: 'published' }).exec(),
        CategoryModel.countDocuments().exec(),
        AssetModel.countDocuments().exec(),
        FontModel.countDocuments().exec(),
        ProjectModel.countDocuments().exec(),
        activityService.recent(12),
      ]);
    ok(res, { users, templates, publishedTemplates, categories, assets, fonts, projects, recentActivity });
  }),
);

dashboardRoutes.get(
  '/activity',
  asyncHandler(async (req: Request, res: Response) => {
    const params = parsePagination(req);
    const { items, total } = await activityService.paginate(params.page, params.limit);
    ok(res, items, buildMeta(params.page, params.limit, total));
  }),
);
