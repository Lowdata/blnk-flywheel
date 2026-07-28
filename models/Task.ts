import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITask extends Document {
  taskId: string;
  description: string;
  rewardAmount: number;
  taskUrl?: string;
  type: string; // e.g., 'twitter_follow', 'twitter_rt', 'referral'
}

const TaskSchema: Schema = new Schema(
  {
    taskId: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    rewardAmount: { type: Number, required: true },
    taskUrl: { type: String },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

export const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
