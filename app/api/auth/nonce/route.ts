import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { generateNonce } from 'siwe';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Rate limit: one nonce per 10 seconds per session
const NONCE_RATE_LIMIT_MS = 10_000;

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    // Rate limiting: reject if last nonce was issued < 10s ago
    if (session.nonceIssuedAt && Date.now() - session.nonceIssuedAt < NONCE_RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before requesting a new nonce.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((NONCE_RATE_LIMIT_MS - (Date.now() - session.nonceIssuedAt)) / 1000)),
          },
        }
      );
    }

    const nonce = generateNonce();
    session.nonce = nonce;
    session.nonceIssuedAt = Date.now();
    await session.save();

    return new NextResponse(nonce, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[AUTH] Error generating nonce:', error.message);
    return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 });
  }
}
