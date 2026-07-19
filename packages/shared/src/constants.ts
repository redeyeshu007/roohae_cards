export const ROLES = ['admin', 'user'] as const;
export type Role = (typeof ROLES)[number];

export const MEASUREMENT_UNITS = ['px', 'mm', 'in'] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const ORIENTATIONS = ['portrait', 'landscape'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export const TEMPLATE_STATUSES = ['draft', 'published', 'archived'] as const;
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export const ASSET_KINDS = ['image', 'icon', 'element'] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
  'image/gif',
] as const;

export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
export const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg'] as const;
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const FONT_EXTENSIONS = ['.otf', '.ttf', '.woff', '.woff2'] as const;

export const ALLOWED_ASSET_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
] as const;

export const EXPORT_FORMATS = ['png', 'jpg', 'pdf'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const MAX_ASSET_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
export const MAX_FONT_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

/** User replacement uploads: raster images only, stored as originals. */
export const REPLACEMENT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const REPLACEMENT_ACCEPT = ['png', 'jpg', 'jpeg', 'webp'] as const;
export const REPLACEMENT_MAX_MB = 10;

export const AUTOSAVE_INTERVAL_MS = 4000;

/** Convert a category dimension to pixels at 300 DPI for print units. */
export function toPixels(value: number, unit: MeasurementUnit, dpi = 300): number {
  switch (unit) {
    case 'px':
      return Math.round(value);
    case 'mm':
      return Math.round((value / 25.4) * dpi);
    case 'in':
      return Math.round(value * dpi);
  }
}
