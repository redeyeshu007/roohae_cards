/**
 * FILE PURPOSE:
 * Multipart/form-data file upload validation and memory buffering middleware.
 *
 * MAIN RESPONSIBILITY:
 * Uses Multer with memory storage to buffer files without compression or quality degradation,
 * enforcing strict MIME type whitelists and file size quotas for media assets, replacement images, and typography fonts.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/assets/assets.routes.ts (uses assetUpload)
 * - apps/api/src/modules/projects/projects.routes.ts (uses replacementUpload)
 * - apps/api/src/modules/fonts/fonts.routes.ts (uses fontUpload)
 */

import path from 'node:path';
import multer from 'multer';
import {
  ALLOWED_ASSET_MIME_TYPES,
  FONT_EXTENSIONS,
  MAX_ASSET_SIZE_BYTES,
  MAX_FONT_SIZE_BYTES,
  REPLACEMENT_MAX_MB,
  REPLACEMENT_MIME_TYPES,
} from '@roohae/shared';
import { ApiError } from '../lib/errors';

/**
 * Files are buffered in memory and handed to the StorageProvider untouched —
 * the ORIGINAL bytes are what get persisted. Thumbnails are generated as
 * separate variants; the original is never recompressed.
 */
// MEMORY BUFFERING STORAGE:
// Retains exact byte fidelity of user uploads in RAM before writing to local disk or Cloudflare R2.
const memory = multer.memoryStorage();

export const assetUpload = multer({
  storage: memory,
  limits: { fileSize: MAX_ASSET_SIZE_BYTES, files: 20 },
  fileFilter: (_req, file, cb) => {
    if ((ALLOWED_ASSET_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
  },
});

/**
 * End-user replacement images: raster only, hard 10 MB cap.
 */
export const replacementUpload = multer({
  storage: memory,
  limits: { fileSize: REPLACEMENT_MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = [...REPLACEMENT_MIME_TYPES] as string[];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(
      ApiError.badRequest(`Replacement images must be PNG, JPG or WEBP (got ${file.mimetype})`),
    );
  },
});

export const fontUpload = multer({
  storage: memory,
  limits: { fileSize: MAX_FONT_SIZE_BYTES, files: 8 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ((FONT_EXTENSIONS as readonly string[]).includes(ext)) {
      cb(null, true);
      return;
    }
    cb(ApiError.badRequest(`Unsupported font file: ${ext || file.originalname}`));
  },
});
