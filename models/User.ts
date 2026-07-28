import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  nonce: string;
  coins: number;
  referralCode: string;
  referredBy?: string;
  completedTasks: mongoose.Types.ObjectId[];
  twitterHandle?: string;
  twitterLinked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
    twitterHandle: { type: String },
    twitterLinked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
