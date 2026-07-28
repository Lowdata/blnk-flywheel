import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Task } from '@/models/Task';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { taskId } = await request.json();
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.siwe) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ walletAddress: session.siwe.address });

    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    const task = await Task.findOne({ taskId });
    if (!task) {
      return NextResponse.json({ ok: false, message: 'Task not found' }, { status: 404 });
    }

    if (user.completedTasks.includes(task._id as any)) {
      return NextResponse.json({ ok: false, message: 'Task already completed' }, { status: 400 });
    }

    // Give reward
    user.coins += task.rewardAmount;
    user.completedTasks.push(task._id as any);
    await user.save();

    return NextResponse.json({ ok: true, coins: user.coins });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
