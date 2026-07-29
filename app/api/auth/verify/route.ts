import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { SiweMessage } from 'siwe';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import '@/models/Task'; // Import to register schema
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { message, signature } = await request.json();
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.nonce) {
      return NextResponse.json({ ok: false, message: 'Session expired or missing nonce. Please refresh and try again.' }, { status: 422 });
    }

    const siweMessage = new SiweMessage(message);

    let verifyResult;
    try {
      verifyResult = await siweMessage.verify({
        signature,
        nonce: session.nonce,
      });
    } catch (siweErr: any) {
      return NextResponse.json({ ok: false, message: 'SIWE Verification failed' }, { status: 422 });
    }

    const { data: fields, success, error } = verifyResult;

    if (!success) {
      return NextResponse.json({ ok: false, message: error?.type || 'Verification failed' }, { status: 422 });
    }

    if (fields.nonce !== session.nonce) {
      return NextResponse.json({ ok: false, message: 'Invalid nonce.' }, { status: 422 });
    }

    // Save SIWE address and clear nonce after successful verification
    session.siwe = {
      address: fields.address,
      chainId: fields.chainId,
    };
    session.nonce = undefined;
    await session.save();

    await dbConnect();
    
    // Create or update user with retry for unique referralCode collision
    let user = await User.findOne({ walletAddress: fields.address });
    if (!user) {
      let created = false;
      let attempts = 0;
      while (!created && attempts < 3) {
        try {
          user = await User.create({
            walletAddress: fields.address,
            nonce: fields.nonce,
            coins: 0, // Economy P1 fix: Start with 0 coins
            referralCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
          });
          created = true;
        } catch (err: any) {
          if (err.code === 11000 && err.keyPattern?.referralCode) {
            attempts++;
            continue;
          }
          throw err;
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
