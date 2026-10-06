/**
 * FILE PURPOSE:
 * Category Mongoose model and MongoDB schema definition for design card sizes.
 *
 * MAIN RESPONSIBILITY:
 * Defines dimensional specifications (width, height, measurement unit, orientation)
 * and URL slug indexing for design product categories (e.g. Business Cards, Invitations).
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/categories/categories.service.ts (queries and writes CategoryModel)
 * - apps/admin & apps/user (uses categories to size new canvases)
 */

import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { MEASUREMENT_UNITS, ORIENTATIONS, type MeasurementUnit, type Orientation } from '@roohae/shared';


export interface CategoryDoc {
  name: string;
  slug: string;
  width: number;
  height: number;
  unit: MeasurementUnit;
  orientation: Orientation;
  description?: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = HydratedDocument<CategoryDoc>;

const categorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, index: true },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: MEASUREMENT_UNITS, required: true },
    orientation: { type: String, enum: ORIENTATIONS, required: true },
    description: { type: String, maxlength: 500 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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

export const CategoryModel: Model<CategoryDoc> = model<CategoryDoc>('Category', categorySchema);
