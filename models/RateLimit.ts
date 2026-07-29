import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRateLimit extends Document {
  key: string;
  lastPlayedAt: Date;
}

const RateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    lastPlayedAt: { type: Date, required: true, expires: 60 }, // Auto-delete documents after 60s
  },
  { timestamps: true }
);

export const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit || mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);
