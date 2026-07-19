import { Schema, model, type Model } from 'mongoose';
import type { Role } from '@roohae/shared';
import { logger } from '../../lib/logger';

interface ActivityLogDoc {
  actorId: Schema.Types.ObjectId;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<ActivityLogDoc>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

activitySchema.index({ createdAt: -1 });

export const ActivityLogModel: Model<ActivityLogDoc> = model<ActivityLogDoc>(
  'ActivityLog',
  activitySchema,
);

export class ActivityService {
  /** Fire-and-forget audit logging — must never fail a request. */
  async log(
    actorId: string,
    actorRole: Role,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await ActivityLogModel.create({ actorId, actorRole, action, entityType, entityId, metadata });
    } catch (err) {
      logger.warn({ err, action }, 'Failed to write activity log');
    }
  }

  async recent(limit = 10) {
    const items = await ActivityLogModel.find().sort({ createdAt: -1 }).limit(limit).exec();
    return items.map((i) => i.toJSON());
  }

  async paginate(page: number, limit: number) {
    const [items, total] = await Promise.all([
      ActivityLogModel.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ActivityLogModel.countDocuments().exec(),
    ]);
    return { items: items.map((i) => i.toJSON()), total };
  }
}

export const activityService = new ActivityService();
