import mongoose, { Document, Model, Schema } from 'mongoose';

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
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase()
    },
    referredBy: { type: String },
    completedTasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    rewards: { type: [RewardItemSchema], default: [] },
    twitterHandle: { type: String },
    twitterLinked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
