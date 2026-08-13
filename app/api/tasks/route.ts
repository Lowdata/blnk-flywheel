import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Task } from '@/models/Task';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    let tasks = await Task.find({}).sort({ createdAt: -1 }).lean();
    const referralTask = tasks.find((t: any) => t.taskId === 'referral_share');
    const otherTasks = tasks.filter((t: any) => t.taskId !== 'referral_share');
    const sortedTasks = referralTask ? [referralTask, ...otherTasks] : otherTasks;
    return NextResponse.json({ ok: true, tasks: sortedTasks });
  } catch (e: any) {
    console.error('[/api/tasks GET]', e);
    return NextResponse.json({ ok: false, message: 'Failed to fetch tasks' }, { status: 500 });
  }
}
