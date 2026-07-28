import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { SiweMessage } from 'siwe';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import '@/models/Task'; // Import to register schema
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('[AUTH DEBUG] Received POST /api/auth/verify request');
  try {
    const { message, signature } = await request.json();
    console.log('[AUTH DEBUG] Request body parsed. Message length:', message ? JSON.stringify(message).length : 0);

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    console.log('[AUTH DEBUG] Session retrieved. Stored session nonce:', session.nonce);

    if (!session.nonce) {
      console.error('[AUTH DEBUG] Session nonce is missing! The nonce cookie was not sent or expired.');
      return NextResponse.json({ ok: false, message: 'Session expired or missing nonce. Please refresh and try again.' }, { status: 422 });
    }

    const siweMessage = new SiweMessage(message);
    console.log('[AUTH DEBUG] SIWE Message nonce:', siweMessage.nonce);

    let verifyResult;
    try {
      verifyResult = await siweMessage.verify({
        signature,
        nonce: session.nonce,
      });
    } catch (siweErr: any) {
      console.error('[AUTH DEBUG] siweMessage.verify threw error:', siweErr.message || siweErr);
      return NextResponse.json({ ok: false, message: siweErr.message || 'SIWE Verification failed' }, { status: 422 });
    }

    const { data: fields, success, error } = verifyResult;

    if (!success) {
      console.error('[AUTH DEBUG] siweMessage.verify returned success=false:', error);
      return NextResponse.json({ ok: false, message: error?.type || 'Verification failed' }, { status: 422 });
    }

    if (fields.nonce !== session.nonce) {
      console.error('[AUTH DEBUG] Nonce mismatch! fields.nonce:', fields.nonce, 'session.nonce:', session.nonce);
      return NextResponse.json({ ok: false, message: 'Invalid nonce.' }, { status: 422 });
    }

    console.log('[AUTH DEBUG] Signature verified successfully for address:', fields.address);

    session.siwe = {
      address: fields.address,
      chainId: fields.chainId,
    };
    await session.save();
    console.log('[AUTH DEBUG] Session saved successfully.');

    console.log('[AUTH DEBUG] Connecting to MongoDB...');
    await dbConnect();
    console.log('[AUTH DEBUG] MongoDB connected.');
    
    // Create or update user
    console.log('[AUTH DEBUG] Finding user in DB:', fields.address);
    let user = await User.findOne({ walletAddress: fields.address });
    if (!user) {
      console.log('[AUTH DEBUG] User not found, creating new User document...');
      user = await User.create({
        walletAddress: fields.address,
        nonce: fields.nonce,
        coins: 10, // Give starting coins for testing
      });
      console.log('[AUTH DEBUG] User created successfully in DB with ID:', user._id);
    } else {
      console.log('[AUTH DEBUG] User found in DB with ID:', user._id);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[AUTH DEBUG] Unhandled Error in verify route:', e);
    return NextResponse.json({ ok: false, message: e.message || 'Internal Server Error', stack: e.stack }, { status: 500 });
  }
}
