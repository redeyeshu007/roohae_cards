/**
 * FILE PURPOSE:
 * Font family Mongoose model and MongoDB schema definition.
 *
 * MAIN RESPONSIBILITY:
 * Defines schema for uploaded custom web fonts, storing family identifiers,
 * category groupings, and individual weight/style FontFace subdocuments with binary storage keys.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/fonts/fonts.service.ts (queries and writes FontModel)
 * - packages/editor-sdk/src/fonts.ts (registers these faces in the browser)
 */

import { Schema, model, type HydratedDocument, type Model } from 'mongoose';


export interface FontFaceDoc {
  weight: number;
  style: 'normal' | 'italic';
  key: string;
  format: 'opentype' | 'truetype' | 'woff' | 'woff2';
  sizeBytes: number;
}

export interface FontDoc {
  family: string;
  category?: string;
  faces: FontFaceDoc[];
  isActive: boolean;
  uploadedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type FontDocument = HydratedDocument<FontDoc>;

const faceSchema = new Schema<FontFaceDoc>(
  {
    weight: { type: Number, required: true },
    style: { type: String, enum: ['normal', 'italic'], required: true },
    key: { type: String, required: true },
    format: { type: String, enum: ['opentype', 'truetype', 'woff', 'woff2'], required: true },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false },
);

const fontSchema = new Schema<FontDoc>(
  {
    family: { type: String, required: true, unique: true, trim: true },
    category: { type: String },
    faces: { type: [faceSchema], default: [] },
    isActive: { type: Boolean, default: true },
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

export const FontModel: Model<FontDoc> = model<FontDoc>('Font', fontSchema);
