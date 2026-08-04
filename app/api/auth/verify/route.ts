import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { SiweMessage } from 'siwe';
import { isAddress } from 'viem';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import '@/models/Task'; // Import to register schema
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Maximum nonce age: 10 minutes
const NONCE_MAX_AGE_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.message !== 'object' || typeof body.signature !== 'string') {
      return NextResponse.json({ ok: false, message: 'Invalid request body.' }, { status: 400 });
    }

    const { message, signature } = body;
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.nonce) {
      return NextResponse.json(
        { ok: false, message: 'Session expired or missing nonce. Please refresh and try again.' },
        { status: 422 }
      );
    }

    // Guard: Nonce must not be older than 10 minutes
    if (session.nonceIssuedAt && Date.now() - session.nonceIssuedAt > NONCE_MAX_AGE_MS) {
      session.nonce = undefined;
      session.nonceIssuedAt = undefined;
      await session.save();
      return NextResponse.json(
        { ok: false, message: 'Nonce expired. Please try connecting again.' },
        { status: 422 }
      );
    }

    const siweMessage = new SiweMessage(message);

    let verifyResult;
    try {
      verifyResult = await siweMessage.verify({
        signature,
        nonce: session.nonce,
      });
    } catch (siweErr: any) {
      return NextResponse.json({ ok: false, message: 'Signature verification failed.' }, { status: 422 });
    }

    const { data: fields, success } = verifyResult;

    if (!success) {
      return NextResponse.json({ ok: false, message: 'Signature verification failed.' }, { status: 422 });
    }

    if (fields.nonce !== session.nonce) {
      return NextResponse.json({ ok: false, message: 'Invalid nonce.' }, { status: 422 });
    }

    // Validate the recovered address is a proper Ethereum address
    if (!fields.address || !isAddress(fields.address)) {
      return NextResponse.json({ ok: false, message: 'Invalid Ethereum address.' }, { status: 422 });
    }

    // Validate domain matches (prevents replay across domains)
    const requestHost = request.headers.get('host') || '';
    if (fields.domain && fields.domain !== requestHost) {
      return NextResponse.json({ ok: false, message: 'Domain mismatch.' }, { status: 422 });
    }

    // Save SIWE address and clear nonce + timestamp after successful verification
    session.siwe = {
      address: fields.address,
      chainId: fields.chainId ?? 1,
    };
    session.nonce = undefined;
    session.nonceIssuedAt = undefined;
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
            nonce: crypto.randomBytes(16).toString('hex'), // Random user nonce, not SIWE nonce
            coins: 0,
            referralCode: 'BLNK-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
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
    console.error('[AUTH] Verify error:', e.message);
    return NextResponse.json({ ok: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
