import crypto from 'node:crypto';
import path from 'node:path';
import type { Font } from '@roohae/shared';
import { getStorage } from '../../storage';
import { ApiError } from '../../lib/errors';
import { FontModel, type FontDocument, type FontFaceDoc } from './font.model';
import { activityService } from '../activity/activity.service';

const FORMAT_BY_EXT: Record<string, FontFaceDoc['format']> = {
  '.otf': 'opentype',
  '.ttf': 'truetype',
  '.woff': 'woff',
  '.woff2': 'woff2',
};

const MIME_BY_FORMAT: Record<FontFaceDoc['format'], string> = {
  opentype: 'font/otf',
  truetype: 'font/ttf',
  woff: 'font/woff',
  woff2: 'font/woff2',
};

/** Infer weight/style from filenames like "Inter-BoldItalic.woff2". */
function inferFace(filename: string): { weight: number; style: 'normal' | 'italic' } {
  const lower = filename.toLowerCase();
  const style: 'normal' | 'italic' = /italic|oblique/.test(lower) ? 'italic' : 'normal';
  const weights: [RegExp, number][] = [
    [/thin|hairline/, 100],
    [/extra-?light|ultra-?light/, 200],
    [/light/, 300],
    [/medium/, 500],
    [/semi-?bold|demi-?bold/, 600],
    [/extra-?bold|ultra-?bold/, 800],
    [/black|heavy/, 900],
    [/bold/, 700],
  ];
  for (const [re, weight] of weights) {
    if (re.test(lower)) return { weight, style };
  }
  return { weight: 400, style };
}

function serializeFont(doc: FontDocument): Font {
  const storage = getStorage();
  // toJSON() converts subdocuments to plain objects — never spread mongoose
  // subdocs directly or their internal state leaks into the response.
  const json = doc.toJSON() as unknown as Font;
  return {
    ...json,
    faces: (json.faces ?? []).map((f) => ({ ...f, url: storage.publicUrl(f.key) })),
  };
}

export class FontsService {
  async upload(
    adminId: string,
    family: string,
    files: { buffer: Buffer; originalname: string; size: number }[],
  ): Promise<Font> {
    if (!files.length) throw ApiError.badRequest('No font files uploaded');
    const storage = getStorage();

    const faces: FontFaceDoc[] = [];
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const format = FORMAT_BY_EXT[ext];
      if (!format) throw ApiError.badRequest(`Unsupported font extension: ${ext}`);

      const hash = crypto.createHash('sha256').update(file.buffer).digest('hex').slice(0, 16);
      const key = `fonts/${hash}${ext}`;
      await storage.put({ key, body: file.buffer, contentType: MIME_BY_FORMAT[format] });

      const { weight, style } = inferFace(file.originalname);
      faces.push({ weight, style, key, format, sizeBytes: file.size });
    }

    const existing = await FontModel.findOne({ family }).exec();
    let doc: FontDocument;
    if (existing) {
      // Merge new faces into the family, replacing same weight+style.
      const merged = existing.faces.filter(
        (f) => !faces.some((n) => n.weight === f.weight && n.style === f.style),
      );
      existing.faces = [...merged, ...faces].sort((a, b) => a.weight - b.weight);
      doc = await existing.save();
    } else {
      doc = await FontModel.create({ family, faces, uploadedBy: adminId });
    }

    await activityService.log(adminId, 'admin', 'font.upload', 'font', doc.id, { family });
    return serializeFont(doc);
  }

  async list(activeOnly: boolean): Promise<Font[]> {
    const filter = activeOnly ? { isActive: true } : {};
    const docs = await FontModel.find(filter).sort({ family: 1 }).exec();
    return docs.map(serializeFont);
  }

  async setActive(adminId: string, id: string, isActive: boolean): Promise<Font> {
    const doc = await FontModel.findById(id).exec();
    if (!doc) throw ApiError.notFound('Font');
    doc.isActive = isActive;
    await doc.save();
    await activityService.log(adminId, 'admin', 'font.update', 'font', id, { isActive });
    return serializeFont(doc);
  }

  async remove(adminId: string, id: string): Promise<void> {
    const doc = await FontModel.findById(id).exec();
    if (!doc) throw ApiError.notFound('Font');
    const storage = getStorage();
    await Promise.allSettled(doc.faces.map((f) => storage.delete(f.key)));
    await doc.deleteOne();
    await activityService.log(adminId, 'admin', 'font.delete', 'font', id);
  }
}

export const fontsService = new FontsService();
