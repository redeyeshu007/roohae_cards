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
