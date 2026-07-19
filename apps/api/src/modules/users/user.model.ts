import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { ROLES, type Role } from '@roohae/shared';

export interface UserDoc {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  /** Bumped to invalidate all outstanding refresh tokens. */
  tokenVersion: number;
  lastLoginAt?: Date;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<UserDoc>;

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user', index: true },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    tokenVersion: { type: Number, default: 0, select: false },
    lastLoginAt: { type: Date },
    permissions: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.passwordHash;
        delete ret.tokenVersion;
        return ret;
      },
    },
  },
);

export const UserModel: Model<UserDoc> = model<UserDoc>('User', userSchema);
