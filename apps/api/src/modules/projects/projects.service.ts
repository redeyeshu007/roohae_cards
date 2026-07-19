import {
  collectAssetIds,
  type CreateProjectInput,
  type DesignDocument,
  type DesignObject,
  type UpdateProjectInput,
} from '@roohae/shared';
import { ApiError } from '../../lib/errors';
import type { PageParams } from '../../lib/http';
import { ProjectModel, type ProjectDocument } from './project.model';
import { TemplateModel } from '../templates/template.model';
import { assetsService } from '../assets/assets.service';
import { activityService } from '../activity/activity.service';

export class ProjectsService {
  /**
   * The core product rule: users never create blank designs and never touch
   * the original template. A project is a deep copy of a PUBLISHED template's
   * document, owned by the user.
   */
  async createFromTemplate(userId: string, input: CreateProjectInput) {
    const template = await TemplateModel.findById(input.templateId).exec();
    if (!template || template.status !== 'published') throw ApiError.notFound('Template');

    // First manual Save from a draft session may carry a customized document —
    // it must pass the exact same rules as a project update.
    let document = structuredClone(template.document);
    if (input.document) {
      this.assertObjectSetUnchanged(template.document, input.document);
      this.assertLockedObjectsUnchanged(template.document, input.document);
      await this.assertPlaceholderRulesRespected(userId, template.document, input.document);
      await this.assertForeignAssetsOwned(userId, template.document, input.document);
      document = input.document;
    }

    let thumbnailUrl = template.thumbnailUrl;
    if (input.thumbnail) {
      const asset = await assetsService.uploadDataUrl(userId, input.thumbnail, `prj-new`);
      thumbnailUrl = asset.variants.find((v) => v.name === 'thumbnail')?.url ?? asset.url;
    }

    const project = await ProjectModel.create({
      title: input.title?.trim() || template.title,
      userId,
      templateId: template._id,
      width: template.width,
      height: template.height,
      unit: template.unit,
      document,
      thumbnailUrl,
      lastEditedAt: new Date(),
    });

    await TemplateModel.updateOne({ _id: template._id }, { $inc: { usageCount: 1 } }).exec();
    await activityService.log(userId, 'user', 'project.create', 'project', project.id, {
      templateId: template.id,
    });
    return project.toJSON();
  }

  /**
   * Autosave endpoint. Server-side enforcement of admin locks: objects marked
   * `editable: false` in the source template must arrive byte-identical —
   * a tampered client cannot modify locked content.
   */
  async update(userId: string, id: string, input: UpdateProjectInput) {
    const project = await this.getOwned(userId, id);

    if (input.document !== undefined) {
      const template = await TemplateModel.findById(project.templateId).exec();
      if (template) {
        this.assertObjectSetUnchanged(template.document, input.document);
        this.assertLockedObjectsUnchanged(template.document, input.document);
        await this.assertPlaceholderRulesRespected(userId, template.document, input.document);
        await this.assertForeignAssetsOwned(userId, template.document, input.document);
      }
      project.document = input.document;
      project.markModified('document');
      project.lastEditedAt = new Date();
    }
    if (input.title !== undefined) project.title = input.title;
    if (input.thumbnail) {
      const asset = await assetsService.uploadDataUrl(userId, input.thumbnail, `prj-${project.id}`);
      project.thumbnailUrl =
        asset.variants.find((v) => v.name === 'thumbnail')?.url ?? asset.url;
    }

    await project.save();
    return project.toJSON();
  }

  /**
   * Any assetId in the incoming document that did not come from the source
   * template must be either the user's own replacement upload or a global
   * library asset. Other users' uploads and system files are rejected.
   */
  private async assertForeignAssetsOwned(
    userId: string,
    templateDoc: DesignDocument,
    incoming: DesignDocument,
  ): Promise<void> {
    const templateAssets = new Set(collectAssetIds(templateDoc));
    const foreign = collectAssetIds(incoming).filter((id) => !templateAssets.has(id));
    if (foreign.length === 0) return;
    const { assetsService } = await import('../assets/assets.service');
    if (!(await assetsService.usableByUser(userId, foreign))) {
      throw ApiError.forbidden('This design references images you do not have access to');
    }
  }

  /**
   * Users customize — they never author. The incoming document must contain
   * exactly the template's pages and object ids: no objects created, none
   * deleted, no pages added or removed. Enforced server-side so a tampered
   * client cannot bypass the customization-only editor.
   */
  private assertObjectSetUnchanged(source: DesignDocument, incoming: DesignDocument): void {
    if (incoming.pages.length !== source.pages.length) {
      throw ApiError.forbidden('Pages cannot be added or removed from this design');
    }
    for (let i = 0; i < source.pages.length; i++) {
      const sourceIds = source.pages[i]!.objects.map((o) => o.id).sort();
      const incomingIds = incoming.pages[i]!.objects.map((o) => o.id).sort();
      if (
        sourceIds.length !== incomingIds.length ||
        sourceIds.some((id, idx) => id !== incomingIds[idx])
      ) {
        throw ApiError.forbidden('Elements cannot be added to or removed from this design');
      }
    }
  }

  /** Permission fields users must never change on ANY object. */
  private static readonly PERMISSION_FIELDS = [
    'editable',
    'locked',
    'placeholderName',
    'allowedAssetIds',
    'allowCustomUpload',
    'accept',
    'maxSizeMB',
  ] as const;

  /**
   * Enforces the editable-image placeholder contract against the TEMPLATE
   * (the authority — never the client's copy):
   *  1. Permission fields are immutable — users cannot grant themselves
   *     rights (e.g. flip allowCustomUpload or extend allowedAssetIds).
   *  2. A changed image assetId must be in that placeholder's admin-curated
   *     allowedAssetIds, or be the user's OWN upload when allowCustomUpload
   *     is enabled (undefined = enabled, for pre-feature documents).
   */
  private async assertPlaceholderRulesRespected(
    userId: string,
    source: DesignDocument,
    incoming: DesignDocument,
  ): Promise<void> {
    const sourceById = new Map<string, DesignObject>();
    for (const page of source.pages) {
      for (const obj of page.objects) sourceById.set(obj.id, obj);
    }

    const customUploadIds: string[] = [];

    for (const page of incoming.pages) {
      for (const obj of page.objects) {
        const tpl = sourceById.get(obj.id);
        if (!tpl) continue; // unknown ids already rejected by assertObjectSetUnchanged

        for (const field of ProjectsService.PERMISSION_FIELDS) {
          if (JSON.stringify(obj[field] ?? null) !== JSON.stringify(tpl[field] ?? null)) {
            throw ApiError.forbidden('Placeholder permissions cannot be modified');
          }
        }

        const changedAsset =
          obj.assetId !== undefined && tpl.assetId !== undefined && obj.assetId !== tpl.assetId;
        if (!changedAsset) continue;

        if (!tpl.editable) {
          throw ApiError.forbidden('Locked images cannot be replaced');
        }
        const gallery = Array.isArray(tpl.allowedAssetIds) ? tpl.allowedAssetIds : [];
        if (gallery.includes(obj.assetId!)) continue; // admin-approved option

        if (tpl.allowCustomUpload === false) {
          throw ApiError.forbidden(
            'This image only accepts the predefined replacement options',
          );
        }
        customUploadIds.push(obj.assetId!);
      }
    }

    if (customUploadIds.length) {
      const { assetsService } = await import('../assets/assets.service');
      if (!(await assetsService.usableByUser(userId, customUploadIds))) {
        throw ApiError.forbidden('This design references images you do not have access to');
      }
    }
  }

  private assertLockedObjectsUnchanged(source: DesignDocument, incoming: DesignDocument): void {
    const lockedById = new Map<string, DesignObject>();
    for (const page of source.pages) {
      for (const obj of page.objects) {
        if (!obj.editable) lockedById.set(obj.id, obj);
      }
    }
    if (lockedById.size === 0) return;

    const seen = new Set<string>();
    for (const page of incoming.pages) {
      for (const obj of page.objects) {
        const locked = lockedById.get(obj.id);
        if (!locked) continue;
        seen.add(obj.id);
        if (JSON.stringify(obj) !== JSON.stringify(locked)) {
          throw ApiError.forbidden('This design contains locked elements that cannot be modified');
        }
      }
    }
    // Locked objects may not be deleted either (page deletions delete their objects,
    // but the template's page set is fixed for users — page count must match).
    if (seen.size !== lockedById.size || incoming.pages.length !== source.pages.length) {
      throw ApiError.forbidden('Locked elements cannot be removed from this design');
    }
  }

  async paginate(userId: string, params: PageParams) {
    const filter: Record<string, unknown> = { userId };
    if (params.search) filter.title = { $regex: params.search, $options: 'i' };
    const [items, total] = await Promise.all([
      ProjectModel.find(filter)
        .select('-document')
        .sort(params.sort)
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      ProjectModel.countDocuments(filter).exec(),
    ]);
    return { items: items.map((p) => p.toJSON()), total };
  }

  async getOwned(userId: string, id: string): Promise<ProjectDocument> {
    const project = await ProjectModel.findById(id).exec();
    if (!project || String(project.userId) !== userId) throw ApiError.notFound('Project');
    return project;
  }

  async remove(userId: string, id: string): Promise<void> {
    const project = await this.getOwned(userId, id);
    await project.deleteOne();
    await activityService.log(userId, 'user', 'project.delete', 'project', id);
  }
}

export const projectsService = new ProjectsService();
