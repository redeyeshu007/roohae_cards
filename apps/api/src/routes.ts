import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { categoriesRoutes } from './modules/categories/categories.routes';
import { assetsRoutes } from './modules/assets/assets.routes';
import { fontsRoutes } from './modules/fonts/fonts.routes';
import { templatesRoutes } from './modules/templates/templates.routes';
import { projectsRoutes } from './modules/projects/projects.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/assets', assetsRoutes);
apiRouter.use('/fonts', fontsRoutes);
apiRouter.use('/templates', templatesRoutes);
apiRouter.use('/projects', projectsRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
