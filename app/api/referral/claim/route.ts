import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { referralCode } = await request.json();
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.siwe) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ ok: false, message: 'Invalid invite code' }, { status: 400 });
    }

    const cleanCode = referralCode.trim().toUpperCase();

    await dbConnect();
    const currentUser = await User.findOne({ walletAddress: session.siwe.address });

    if (!currentUser) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    if (currentUser.referredBy) {
      return NextResponse.json(
        { ok: false, message: 'You have already applied a referral code!' },
        { status: 400 }
      );
    }

    if (currentUser.referralCode === cleanCode) {
      return NextResponse.json(
        { ok: false, message: 'You cannot refer yourself!' },
        { status: 400 }
      );
    }

    const referrer = await User.findOne({ referralCode: cleanCode });
    if (!referrer) {
      return NextResponse.json(
        { ok: false, message: 'Referral code not found' },
        { status: 404 }
      );
    }

    // Check if already in referrals list
    const alreadyReferred = referrer.referrals?.some(
      (id: any) => (id._id || id).toString() === currentUser._id.toString()
    );

    if (!alreadyReferred) {
      await User.updateOne(
        { _id: referrer._id },
        {
          $addToSet: { referrals: currentUser._id },
          $inc: { coins: 30 }, // Reward referrer +30 coins
        }
      );
    }

    // Link currentUser atomically
    const updatedUser = await User.findOneAndUpdate(
      { _id: currentUser._id, referredBy: { $exists: false } },
      { 
        $set: { referredBy: cleanCode },
        $inc: { coins: 15 }
      },
      { new: true }
    );
    
    if (!updatedUser) {
        return NextResponse.json({ ok: false, message: 'Referral code already applied or error occurred' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Referral code applied! You earned +15 COINS welcome bonus.',
      coins: updatedUser.coins,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || 'Error applying referral code' },
      { status: 500 }
    );
  }
}
