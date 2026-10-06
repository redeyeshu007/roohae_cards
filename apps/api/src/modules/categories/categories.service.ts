/**
 * FILE PURPOSE:
 * Category domain service managing product card sizes, taxonomy, and relations.
 *
 * MAIN RESPONSIBILITY:
 * Handles category creation with automatic slug generation, updates, deletion guards
 * (rejects deletion if templates depend on the category), and attaches template counts via MongoDB aggregation.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/categories/categories.routes.ts (routes call service methods)
 * - apps/api/src/modules/categories/category.model.ts (MongoDB Category model)
 * - apps/api/src/modules/templates/template.model.ts (checks template foreign key usage)
 */

import type { CreateCategoryInput, UpdateCategoryInput } from '@roohae/shared';
import { ApiError } from '../../lib/errors';
import { slugify, uniqueSlug } from '../../lib/slug';
import type { PageParams } from '../../lib/http';
import { CategoryModel } from './category.model';
import { TemplateModel } from '../templates/template.model';
import { activityService } from '../activity/activity.service';

export class CategoriesService {

  async create(adminId: string, input: CreateCategoryInput) {
    const slug = slugify(input.name);
    const exists = await CategoryModel.findOne({ slug }).exec();
    const category = await CategoryModel.create({
      ...input,
      slug: exists ? uniqueSlug(input.name) : slug,
      createdBy: adminId,
    });
    await activityService.log(adminId, 'admin', 'category.create', 'category', category.id, {
      name: category.name,
    });
    return category.toJSON();
  }

  async update(adminId: string, id: string, input: UpdateCategoryInput) {
    const category = await CategoryModel.findById(id).exec();
    if (!category) throw ApiError.notFound('Category');
    Object.assign(category, input);
    await category.save();
    await activityService.log(adminId, 'admin', 'category.update', 'category', category.id);
    return category.toJSON();
  }

  async remove(adminId: string, id: string) {
    const templateCount = await TemplateModel.countDocuments({ categoryId: id }).exec();
    if (templateCount > 0) {
      throw ApiError.conflict(
        `Cannot delete: ${templateCount} template(s) belong to this category. Archive it instead.`,
      );
    }
    const category = await CategoryModel.findByIdAndDelete(id).exec();
    if (!category) throw ApiError.notFound('Category');
    await activityService.log(adminId, 'admin', 'category.delete', 'category', id);
  }

  async paginate(params: PageParams, activeOnly = false) {
    const filter: Record<string, unknown> = {};
    if (activeOnly) filter.isActive = true;
    if (params.search) filter.name = { $regex: params.search, $options: 'i' };

    const [items, total] = await Promise.all([
      CategoryModel.find(filter).sort(params.sort).skip(params.skip).limit(params.limit).exec(),
      CategoryModel.countDocuments(filter).exec(),
    ]);

    // Attach template counts in one aggregation instead of N queries.
    const counts = await TemplateModel.aggregate<{ _id: string; count: number }>([
      { $match: { categoryId: { $in: items.map((c) => c._id) } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]).exec();
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    return {
      items: items.map((c) => ({ ...c.toJSON(), templateCount: countMap.get(c.id) ?? 0 })),
      total,
    };
  }

  async getById(id: string) {
    const category = await CategoryModel.findById(id).exec();
    if (!category) throw ApiError.notFound('Category');
    return category.toJSON();
  }
}

export const categoriesService = new CategoriesService();
