import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Task } from '@/models/Task';

export const revalidate = 60; // Cache for 60 seconds (ISR)

export async function GET() {
  try {
    await dbConnect();
    const tasks = await Task.find({}).sort({ createdAt: 1 });
    return NextResponse.json({ ok: true, tasks });
  } catch (e: any) {
    console.error('[/api/tasks GET]', e);
    return NextResponse.json({ ok: false, message: 'Failed to fetch tasks' }, { status: 500 });
  }
}
