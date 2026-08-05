import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Please define MONGODB_URI in .env.local');
  process.exit(1);
}

const TaskSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    rewardAmount: { type: Number, required: true },
    taskUrl: { type: String },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

const TASKS_TO_SEED = [
  {
    taskId: 'twitter_follow',
    description: 'Follow @BlnkINC on Twitter',
    rewardAmount: 15,
    taskUrl: 'https://twitter.com/intent/user?screen_name=BlnkINC',
    type: 'twitter_follow',
  },
  {
    taskId: 'twitter_rt',
    description: 'Like & RT our announcement tweet',
    rewardAmount: 20,
    taskUrl: 'https://twitter.com/intent/retweet?tweet_id=1800000000000000000',
    type: 'twitter_rt',
  },
  {
    taskId: 'twitter_intent',
    description: 'Tweet about the BLNK Arcade',
    rewardAmount: 25,
    taskUrl: 'https://twitter.com/intent/tweet?text=Trying%20my%20luck%20at%20the%20%40BlnkINC%20Claw%20Machine%21%20The%20grey%20is%20breaking%20%F0%9F%95%B9%EF%B8%8F%F0%9F%91%BE',
    type: 'twitter_intent',
  },
  {
    taskId: 'referral_share',
    description: 'Refer friends to earn coins',
    rewardAmount: 30,
    taskUrl: 'https://twitter.com/intent/tweet?text=Join%20me%20at%20the%20%40BlnkINC%20Arcade%21%20Use%20my%20code%20to%20get%20%2B15%20COINS%20%F0%9F%95%B9%EF%B8%8F%F0%9F%91%BE',
    type: 'referral',
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected. Seeding tasks collection...');

    for (const t of TASKS_TO_SEED) {
      await Task.findOneAndUpdate(
        { taskId: t.taskId },
        { $set: t },
        { upsert: true, new: true }
      );
      console.log(`✓ Upserted task: ${t.taskId}`);
    }

    console.log('All tasks seeded successfully into MongoDB collection.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding tasks:', err);
    process.exit(1);
  }
}

seed();
