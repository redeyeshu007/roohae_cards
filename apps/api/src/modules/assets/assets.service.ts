import crypto from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { collectAssetIds, type Asset, type AssetKind } from '@roohae/shared';
import { getStorage } from '../../storage';
import { ApiError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import type { PageParams } from '../../lib/http';
import { AssetModel, type AssetDocument, type AssetScope } from './asset.model';

/**
 * Matches global-library assets, including records created before the
 * `scope` field existed (which were admin uploads unless their folder
 * marks them as user replacements or generated thumbnails).
 */
const LIBRARY_SCOPE_FILTER = {
  $or: [
    { scope: 'library' },
    { scope: { $exists: false }, folder: { $nin: ['user-replacements', 'thumbnails'] } },
  ],
};
import { activityService } from '../activity/activity.service';

const THUMBNAIL_MAX = 480;

function kindFromMime(mime: string): AssetKind {
  if (mime === 'image/svg+xml') return 'icon';

  if (mime.startsWith('image/')) return 'image';

  return 'element';
}

/**
 * Content-addressed key, scoped to the uploader. The owner is part of the
 * hash so identical bytes uploaded by different accounts become DIFFERENT
 * assets — otherwise a user's upload could dedupe onto an admin-owned asset
 * they are not allowed to reference.
 */
function storageKey(prefix: string, originalName: string, buffer: Buffer, ownerId: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(buffer)
    .update(ownerId)
    .digest('hex')
    .slice(0, 16);
  const ext = path.extname(originalName).toLowerCase() || '';
  return `${prefix}/${hash}${ext}`;
}

export function serializeAsset(doc: AssetDocument): Asset {
  const storage = getStorage();
  // toJSON() converts subdocuments to plain objects — never spread mongoose
  // subdocs directly or their internal state leaks into the response.
  const json = doc.toJSON() as unknown as Asset;
  return {
    ...json,
    url: storage.publicUrl(doc.key),
    variants: (json.variants ?? []).map((v) => ({ ...v, url: storage.publicUrl(v.key) })),
  };
}

export class AssetsService {
  /**
   * Persist the ORIGINAL bytes untouched, then derive an optimized thumbnail
   * as a separate variant. The editor and exports always use the original.
   */
  async upload(
    adminId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    options: {
      tags?: string[];
      folder?: string;
      kind?: AssetKind;
      actorRole?: 'admin' | 'user';
      scope?: AssetScope;
    } = {},
  ): Promise<Asset> {
    const storage = getStorage();
    const kind = options.kind ?? kindFromMime(file.mimetype);
    const key = storageKey('assets/originals', file.originalname, file.buffer, adminId);

    // Per-owner content dedupe: identical re-uploads by the SAME account
    // return the existing asset; other accounts get their own copy.
    const existing = await AssetModel.findOne({ key, uploadedBy: adminId }).exec();
    if (existing) return serializeAsset(existing);

    await storage.put({ key, body: file.buffer, contentType: file.mimetype });

    let width: number | undefined;
    let height: number | undefined;
    const variants: { name: string; key: string; width?: number; height?: number; sizeBytes: number }[] = [];

    const isRaster = file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml';
    if (isRaster) {
      try {
        const meta = await sharp(file.buffer, { animated: file.mimetype === 'image/gif' }).metadata();
        width = meta.width;
        height = meta.height;

        // Thumbnail is a NEW derived file — the original is never modified.
        const thumb = await sharp(file.buffer)
          .resize(THUMBNAIL_MAX, THUMBNAIL_MAX, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        const thumbKey = key.replace('assets/originals', 'assets/thumbnails').replace(/\.[^.]+$/, '.webp');
        await storage.put({ key: thumbKey, body: thumb, contentType: 'image/webp' });
        const thumbMeta = await sharp(thumb).metadata();
        variants.push({
          name: 'thumbnail',
          key: thumbKey,
          width: thumbMeta.width,
          height: thumbMeta.height,
          sizeBytes: thumb.byteLength,
        });
      } catch (err) {
        logger.warn({ err, file: file.originalname }, 'Thumbnail generation failed; original stored');
      }
    }

    const doc = await AssetModel.create({
      scope: options.scope ?? 'library',
      kind,
      originalName: file.originalname,
      mimeType: file.mimetype,
      key,
      sizeBytes: file.size,
      width,
      height,
      variants,
      tags: options.tags ?? [],
      folder: options.folder,
      uploadedBy: adminId,
    });

    await activityService.log(adminId, options.actorRole ?? 'admin', 'asset.upload', 'asset', doc.id, {
      name: file.originalname,
      kind,
    });
    return serializeAsset(doc);
  }


  /** Store a PNG data URL (e.g. template thumbnails rendered by the editor). */
  async uploadDataUrl(adminId: string, dataUrl: string, name: string): Promise<Asset> {
    const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(dataUrl);
    if (!match) throw ApiError.badRequest('Invalid image data URL');
    const [, mimetype, base64] = match;
    const buffer = Buffer.from(base64!, 'base64');
    if (buffer.byteLength > 15 * 1024 * 1024) throw ApiError.tooLarge('Thumbnail too large');
    return this.upload(
      adminId,
      { buffer, originalname: `${name}.png`, mimetype: mimetype!, size: buffer.byteLength },
      // Generated thumbnails are system files — never shown in any library.
      { folder: 'thumbnails', kind: 'image', scope: 'system' },
    );
  }

  /**
   * The global Asset Library (Uploads panel). ALWAYS scoped to admin-curated
   * library assets — user replacement images and generated thumbnails never
   * appear here, for admins or users.
   */
  async paginate(params: PageParams, filters: { kind?: string; folder?: string } = {}) {
    const filter: Record<string, unknown> = { $and: [LIBRARY_SCOPE_FILTER] };
    if (filters.kind) filter.kind = filters.kind;
    if (filters.folder) filter.folder = filters.folder;
    if (params.search) {
      (filter.$and as unknown[]).push({
        $or: [
          { originalName: { $regex: params.search, $options: 'i' } },
          { tags: { $regex: params.search, $options: 'i' } },
        ],
      });
    }
    const [items, total] = await Promise.all([
      AssetModel.find(filter).sort(params.sort).skip(params.skip).limit(params.limit).exec(),
      AssetModel.countDocuments(filter).exec(),
    ]);
    return { items: items.map(serializeAsset), total };
  }

  async getMany(ids: string[]): Promise<Asset[]> {
    const docs = await AssetModel.find({ _id: { $in: ids } }).exec();
    return docs.map(serializeAsset);
  }

  /**
   * Resolve asset ids for an END USER. Users must never enumerate the admin
   * library or other users' uploads, so the allowed set is strictly:
   *   assets referenced by one of THEIR OWN projects (projectId)
   *   ∪ assets referenced by a PUBLISHED template (templateId — draft
   *     sessions before the first manual save)
   *   ∪ assets they uploaded themselves (replacement images).
   * Anything outside that set is silently omitted.
   */
  async resolveForUser(
    userId: string,
    ids: string[],
    scope: { projectId?: string; templateId?: string } = {},
  ): Promise<Asset[]> {
    const allowed = new Set<string>();

    if (scope.projectId) {
      // Local import to avoid a module cycle (projects.service → assets.service).
      const { ProjectModel } = await import('../projects/project.model');
      const project = await ProjectModel.findById(scope.projectId).exec();
      if (project && String(project.userId) === userId) {
        for (const id of collectAssetIds(project.document)) allowed.add(id);
      }
    }

    if (scope.templateId) {
      const { TemplateModel } = await import('../templates/template.model');
      const template = await TemplateModel.findById(scope.templateId).exec();
      if (template && template.status === 'published') {
        for (const id of collectAssetIds(template.document)) allowed.add(id);
      }
    }

    const requested = [...new Set(ids)];
    const docs = await AssetModel.find({ _id: { $in: requested } }).exec();
    // Strictly project-scoped + own uploads: users never resolve arbitrary
    // library ids — only assets their project document actually references.
    return docs
      .filter((doc) => allowed.has(doc.id) || String(doc.uploadedBy) === userId)
      .map(serializeAsset);
  }

  /** Assets uploaded by this user (their replacement images). */
  async listOwned(userId: string, params: PageParams) {
    const filter: Record<string, unknown> = { uploadedBy: userId };
    if (params.search) filter.originalName = { $regex: params.search, $options: 'i' };
    const [items, total] = await Promise.all([
      AssetModel.find(filter).sort(params.sort).skip(params.skip).limit(params.limit).exec(),
      AssetModel.countDocuments(filter).exec(),
    ]);
    return { items: items.map(serializeAsset), total };
  }

  /**
   * True when every id is usable by this user in a project document.
   * Assets not inherited from the template must be the user's OWN
   * replacement uploads — the admin library, other users' uploads, system
   * files and unknown ids are all rejected.
   */
  async usableByUser(userId: string, ids: string[]): Promise<boolean> {
    if (!ids.length) return true;
    const unique = [...new Set(ids)];
    const count = await AssetModel.countDocuments({
      _id: { $in: unique },
      uploadedBy: userId,
    }).exec();
    return count === unique.length;
  }

  async remove(adminId: string, id: string): Promise<void> {
    const doc = await AssetModel.findById(id).exec();
    if (!doc) throw ApiError.notFound('Asset');

    const storage = getStorage();
    await Promise.allSettled([
      storage.delete(doc.key),
      ...doc.variants.map((v) => storage.delete(v.key)),
    ]);
    await doc.deleteOne();
    await activityService.log(adminId, 'admin', 'asset.delete', 'asset', id);
  }
}

export const assetsService = new AssetsService();
