import type {
  AssetKind,
  MeasurementUnit,
  Orientation,
  Role,
  TemplateStatus,
} from '../constants';
import type { DesignDocument } from './design';

/** All persisted entities share these fields. */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  width: number;
  height: number;
  unit: MeasurementUnit;
  orientation: Orientation;
  description?: string;
  thumbnailAssetId?: string;
  isActive: boolean;
  templateCount?: number;
}

export interface AssetVariant {
  /** e.g. "thumbnail", "preview" */
  name: string;
  key: string;
  url: string;
  width?: number;
  height?: number;
  sizeBytes: number;
}

export interface Asset extends BaseEntity {
  kind: AssetKind;
  originalName: string;
  mimeType: string;
  /** Storage key of the ORIGINAL, untouched file. */
  key: string;
  url: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationMs?: number;
  /** Derived, optimized renditions. The original is never modified. */
  variants: AssetVariant[];
  tags: string[];
  folder?: string;
  uploadedBy: string;
}

export interface FontFace {
  weight: number;
  style: 'normal' | 'italic';
  key: string;
  url: string;
  format: 'opentype' | 'truetype' | 'woff' | 'woff2';
  sizeBytes: number;
}

export interface Font extends BaseEntity {
  family: string;
  category?: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  faces: FontFace[];
  isActive: boolean;
  uploadedBy: string;
}

export interface Template extends BaseEntity {
  title: string;
  slug: string;
  categoryId: string;
  category?: Category;
  status: TemplateStatus;
  width: number;
  height: number;
  unit: MeasurementUnit;
  orientation: Orientation;
  document: DesignDocument;
  thumbnailUrl?: string;
  /** Asset ids referenced by the document — used for integrity checks and prefetching. */
  assetIds: string[];
  fontFamilies: string[];
  tags: string[];
  createdBy: string;
  publishedAt?: string;
  usageCount: number;
}

export interface Project extends BaseEntity {
  title: string;
  userId: string;
  templateId: string;
  template?: Pick<Template, 'id' | 'title' | 'thumbnailUrl'>;
  width: number;
  height: number;
  unit: MeasurementUnit;
  document: DesignDocument;
  thumbnailUrl?: string;
  lastEditedAt: string;
}

export interface ActivityLog extends BaseEntity {
  actorId: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}
