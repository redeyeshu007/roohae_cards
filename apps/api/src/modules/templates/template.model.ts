/**
 * FILE PURPOSE:
 * Mongoose schema and model definition for design templates in the Roohae marketplace/catalog.
 *
 * MAIN RESPONSIBILITY:
 * Stores template canvas JSON (DesignDocument), category association, status (draft/published/archived),
 * dimensions, thumbnail URL, referenced asset IDs, font families, tags, and usage counters.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/templates/templates.service.ts (Template CRUD and publishing)
 * - packages/shared/src/schemas/template.schema.ts (Zod validation schemas)
 * - apps/admin & apps/user (Template catalog, gallery, and editor)
 */

import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import {
  MEASUREMENT_UNITS,
  ORIENTATIONS,
  TEMPLATE_STATUSES,
  type DesignDocument,
  type MeasurementUnit,
  type Orientation,
  type TemplateStatus,
} from '@roohae/shared';

export interface TemplateDoc {
  title: string;
  slug: string;
  categoryId: Schema.Types.ObjectId;
  status: TemplateStatus;
  width: number;
  height: number;
  unit: MeasurementUnit;
  orientation: Orientation;
  document: DesignDocument;
  thumbnailUrl?: string;
  assetIds: string[];
  fontFamilies: string[];
  tags: string[];
  createdBy: Schema.Types.ObjectId;
  publishedAt?: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateDocument = HydratedDocument<TemplateDoc>;

const templateSchema = new Schema<TemplateDoc>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    status: { type: String, enum: TEMPLATE_STATUSES, default: 'draft', index: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    unit: { type: String, enum: MEASUREMENT_UNITS, required: true },
    orientation: { type: String, enum: ORIENTATIONS, required: true },
    document: { type: Schema.Types.Mixed, required: true },
    thumbnailUrl: { type: String },
    assetIds: { type: [String], default: [] },
    fontFamilies: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date },
    usageCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    minimize: false,
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

templateSchema.index({ title: 'text', tags: 'text' });
templateSchema.index({ status: 1, categoryId: 1, publishedAt: -1 });

export const TemplateModel: Model<TemplateDoc> = model<TemplateDoc>('Template', templateSchema);
