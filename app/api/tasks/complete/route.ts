import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Task } from '@/models/Task';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { taskId, data } = await request.json();
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

    // Atomic update prevents concurrent requests from duplicate coin awards
    const updateOp: any = {
      $inc: { coins: task.rewardAmount },
      $addToSet: { completedTasks: task._id },
    };
    if (task.taskId === 'twitter_connect') {
      let handle = data?.username || '@BLNK_Member';
      if (!handle.startsWith('@')) handle = '@' + handle;
      
      updateOp.$set = {
        twitterLinked: true,
        twitterHandle: handle,
      };
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        walletAddress: session.siwe.address,
        completedTasks: { $ne: task._id },
      },
      updateOp,
      { new: true }
    );

    if (!updatedUser) {
      const currentUser = await User.findOne({ walletAddress: session.siwe.address });
      return NextResponse.json({
        ok: true,
        message: 'Task already completed',
        coins: currentUser ? currentUser.coins : 0,
        completedTaskId: task._id,
        alreadyCompleted: true,
      });
    }

    return NextResponse.json({ ok: true, coins: updatedUser.coins, completedTaskId: task._id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
