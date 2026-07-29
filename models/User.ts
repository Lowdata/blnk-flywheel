import mongoose, { Document, Model, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IRewardItem {
  _id?: mongoose.Types.ObjectId;
  type: 'GTD' | 'FCFS' | 'LOSS';
  claimed: boolean;
  transactionHash?: string;
  createdAt?: Date;
}

export interface IUser extends Document {
  walletAddress: string;
  nonce: string;
  coins: number;
  referralCode: string;
  referredBy?: string;
  referrals: mongoose.Types.ObjectId[];
  completedTasks: mongoose.Types.ObjectId[];
  rewards: IRewardItem[];
  twitterHandle?: string;
  twitterLinked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RewardItemSchema = new Schema(
  {
    type: { type: String, enum: ['GTD', 'FCFS', 'LOSS'], required: true },
    claimed: { type: Boolean, default: false },
    transactionHash: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const UserSchema: Schema = new Schema(
  {
    walletAddress: { type: String, required: true, unique: true },
    nonce: { type: String, required: true },
    coins: { type: Number, default: 0 },
    referralCode: {
      type: String,
      unique: true,
      default: () => 'BLNK-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    },
    referredBy: { type: String },
    referrals: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    completedTasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    rewards: { type: [RewardItemSchema], default: [] },
    twitterHandle: { type: String },
    twitterLinked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
