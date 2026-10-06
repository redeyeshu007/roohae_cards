/**
 * FILE PURPOSE:
 * Manages administrative master templates, dimension calculation, category binding,
 * asset and font dependency tracking, publishing lifecycle status state machine,
 * and template duplication.
 *
 * MAIN RESPONSIBILITY:
 * Enforces publishing state machine transitions (draft ↔ published → archived),
 * calculates canvas dimensions at 300 DPI, updates template document JSON, and indexes asset references.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/templates/templates.routes.ts (receives HTTP requests)
 * - apps/api/src/modules/templates/template.model.ts (MongoDB operations via Mongoose)
 * - apps/admin & apps/user (API consumers)
 */


import {
  collectAssetIds,
  collectFontFamilies,
  createEmptyDocument,
  toPixels,
  type CreateTemplateInput,
  type DesignDocument,
  type DesignObject,
  type DesignPage,
  type TemplateStatus,
  type UpdateTemplateInput,
} from '@roohae/shared';
import { ApiError } from '../../lib/errors';
import { uniqueSlug } from '../../lib/slug';
import type { PageParams } from '../../lib/http';
import { TemplateModel, type TemplateDocument } from './template.model';
import { CategoryModel } from '../categories/category.model';
import { assetsService } from '../assets/assets.service';
import { activityService } from '../activity/activity.service';

const VALID_TRANSITIONS: Record<TemplateStatus, TemplateStatus[]> = {
  draft: ['published', 'archived'],
  published: ['draft', 'archived'],
  archived: ['draft'],
};

export class TemplatesService {
  async create(adminId: string, input: CreateTemplateInput) {
    const category = await CategoryModel.findById(input.categoryId).exec();
    if (!category) throw ApiError.notFound('Category');

    // Dimensions may be tweaked per-template, but the unit resolves to px at 300 DPI for print.
    const pxWidth = toPixels(input.width, input.unit);
    const pxHeight = toPixels(input.height, input.unit);

    const template = await TemplateModel.create({
      ...input,
      slug: uniqueSlug(input.title),
      document: createEmptyDocument(pxWidth, pxHeight),
      createdBy: adminId,
    });
    await activityService.log(adminId, 'admin', 'template.create', 'template', template.id, {
      title: template.title,
    });
    return template.toJSON();
  }

  async update(adminId: string, id: string, input: UpdateTemplateInput) {
    const template = await TemplateModel.findById(id).exec();
    if (!template) throw ApiError.notFound('Template');

    if (input.title !== undefined) template.title = input.title;
    if (input.tags !== undefined) template.tags = input.tags;
    if (input.categoryId !== undefined) {
      const category = await CategoryModel.findById(input.categoryId).exec();
      if (!category) throw ApiError.notFound('Category');
      template.categoryId = category._id as never;
    }
    if (input.document !== undefined) {
      template.document = input.document;
      template.assetIds = collectAssetIds(input.document);
      template.fontFamilies = collectFontFamilies(input.document);
      template.markModified('document');
    }
    if (input.thumbnail) {
      const asset = await assetsService.uploadDataUrl(adminId, input.thumbnail, `tpl-${template.id}`);
      template.thumbnailUrl =
        asset.variants.find((v) => v.name === 'thumbnail')?.url ?? asset.url;
    }

    await template.save();
    return template.toJSON();
  }

  async setStatus(adminId: string, id: string, status: TemplateStatus) {
    const template = await TemplateModel.findById(id).exec();
    if (!template) throw ApiError.notFound('Template');

    if (template.status !== status && !VALID_TRANSITIONS[template.status].includes(status)) {
      throw ApiError.badRequest(`Cannot move a ${template.status} template to ${status}`);
    }
    if (status === 'published') {
      const pageCount = template.document?.pages?.length ?? 0;
      if (pageCount === 0) throw ApiError.badRequest('Cannot publish an empty template');
      template.publishedAt = new Date();
    }
    template.status = status;
    await template.save();
    await activityService.log(adminId, 'admin', `template.${status}`, 'template', id, {
      title: template.title,
    });
    return template.toJSON();
  }

  async duplicate(adminId: string, id: string) {
    const source = await TemplateModel.findById(id).exec();
    if (!source) throw ApiError.notFound('Template');

    const copy = await TemplateModel.create({
      title: `${source.title} (copy)`,
      slug: uniqueSlug(source.title),
      categoryId: source.categoryId,
      status: 'draft',
      width: source.width,
      height: source.height,
      unit: source.unit,
      orientation: source.orientation,
      document: structuredClone(source.document),
      thumbnailUrl: source.thumbnailUrl,
      assetIds: [...source.assetIds],
      fontFamilies: [...source.fontFamilies],
      tags: [...source.tags],
      createdBy: adminId,
    });
    await activityService.log(adminId, 'admin', 'template.duplicate', 'template', copy.id);
    return copy.toJSON();
  }

  async remove(adminId: string, id: string) {
    const template = await TemplateModel.findById(id).exec();
    if (!template) throw ApiError.notFound('Template');
    if (template.status === 'published') {
      throw ApiError.conflict('Unpublish or archive this template before deleting it');
    }
    await template.deleteOne();
    await activityService.log(adminId, 'admin', 'template.delete', 'template', id);
  }

  /** Admin listing: all statuses. User listing: published only. */
  async paginate(
    params: PageParams,
    filters: { status?: string; categoryId?: string; publishedOnly?: boolean },
  ) {
    const filter: Record<string, unknown> = {};
    if (filters.publishedOnly) filter.status = 'published';
    else if (filters.status) filter.status = filters.status;
    if (filters.categoryId) filter.categoryId = filters.categoryId;
    if (params.search) {
      filter.$or = [
        { title: { $regex: params.search, $options: 'i' } },
        { tags: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      TemplateModel.find(filter)
        .select('-document') // list views never need the full document
        .populate('categoryId', 'name slug width height unit orientation')
        .sort(params.sort)
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      TemplateModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((t) => {
        const json = t.toJSON() as Record<string, unknown>;
        const populated = json.categoryId as Record<string, unknown> | null;
        if (populated && typeof populated === 'object') {
          json.category = { ...populated, id: String(populated._id ?? populated.id) };
          delete (json.category as Record<string, unknown>)._id;
          json.categoryId = (json.category as Record<string, unknown>).id;
        }
        return json;
      }),
      total,
    };
  }

  async getById(id: string, publishedOnly = false): Promise<TemplateDocument> {
    const template = await TemplateModel.findById(id).exec();
    if (!template) throw ApiError.notFound('Template');
    if (publishedOnly && template.status !== 'published') throw ApiError.notFound('Template');
    return template;
  }
}

export const templatesService = new TemplatesService();
