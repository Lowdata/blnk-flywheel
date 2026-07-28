import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReward extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'GTD' | 'FCFS' | 'LOSS';
  claimed: boolean;
  transactionHash?: string;
}

const RewardSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['GTD', 'FCFS', 'LOSS'], required: true },
    claimed: { type: Boolean, default: false },
    transactionHash: { type: String },
  },
  { timestamps: true }
);

export const Reward: Model<IReward> = mongoose.models.Reward || mongoose.model<IReward>('Reward', RewardSchema);
