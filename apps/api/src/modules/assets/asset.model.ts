import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { ASSET_KINDS, type AssetKind } from '@roohae/shared';

export interface AssetVariantDoc {
  name: string;
  key: string;
  width?: number;
  height?: number;
  sizeBytes: number;
}

/**
 * Hard separation of asset sources:
 *  - library: the global platform library, curated by admins (Uploads panel)
 *  - user:    a user's private replacement images (Editable Images panel)
 *  - system:  generated files (template/project thumbnails) — never listed
 */
export type AssetScope = 'library' | 'user' | 'system';

export interface AssetDoc {
  scope: AssetScope;
  kind: AssetKind;
  originalName: string;
  mimeType: string;
  /** Storage key of the ORIGINAL bytes — never recompressed. */
  key: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationMs?: number;
  variants: AssetVariantDoc[];
  tags: string[];
  folder?: string;
  uploadedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type AssetDocument = HydratedDocument<AssetDoc>;

const variantSchema = new Schema<AssetVariantDoc>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true },
    width: Number,
    height: Number,
    sizeBytes: { type: Number, required: true },
  },
  { _id: false },
);

const assetSchema = new Schema<AssetDoc>(
  {
    scope: {
      type: String,
      enum: ['library', 'user', 'system'],
      default: 'library',
      index: true,
    },
    kind: { type: String, enum: ASSET_KINDS, required: true, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    sizeBytes: { type: Number, required: true },
    width: Number,
    height: Number,
    durationMs: Number,
    variants: { type: [variantSchema], default: [] },
    tags: { type: [String], default: [], index: true },
    folder: { type: String, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

assetSchema.index({ originalName: 'text', tags: 'text' });
// Compound index covering the most common library browse pattern
assetSchema.index({ scope: 1, kind: 1, createdAt: -1 });
assetSchema.index({ uploadedBy: 1, scope: 1, createdAt: -1 });

export const AssetModel: Model<AssetDoc> = model<AssetDoc>('Asset', assetSchema);
