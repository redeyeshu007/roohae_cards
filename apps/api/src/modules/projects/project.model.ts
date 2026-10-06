/**
 * FILE PURPOSE:
 * Mongoose schema and model definition for user card design projects.
 *
 * MAIN RESPONSIBILITY:
 * Persists customized user design documents, template origin reference, dimensions,
 * canvas JSON payload (DesignDocument), thumbnail image URL, and edit timestamps.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/projects/projects.service.ts (queries and updates user projects)
 * - packages/shared/src/schemas/project.schema.ts (Zod validation schemas)
 * - apps/user/src/components/ProjectEditor.tsx (User canvas editing UI)
 */

import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import {
  MEASUREMENT_UNITS,
  type DesignDocument,
  type MeasurementUnit,
} from '@roohae/shared';

export interface ProjectDoc {
  title: string;
  userId: Schema.Types.ObjectId;
  templateId: Schema.Types.ObjectId;
  width: number;
  height: number;
  unit: MeasurementUnit;
  document: DesignDocument;
  thumbnailUrl?: string;
  lastEditedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectDocument = HydratedDocument<ProjectDoc>;

const projectSchema = new Schema<ProjectDoc>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true, index: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    unit: { type: String, enum: MEASUREMENT_UNITS, required: true },
    document: { type: Schema.Types.Mixed, required: true },
    thumbnailUrl: { type: String },
    lastEditedAt: { type: Date, default: Date.now },
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

projectSchema.index({ userId: 1, lastEditedAt: -1 });

export const ProjectModel: Model<ProjectDoc> = model<ProjectDoc>('Project', projectSchema);
