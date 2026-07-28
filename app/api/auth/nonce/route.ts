import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { generateNonce } from 'siwe';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const nonce = generateNonce();
    session.nonce = nonce;
    await session.save();

    console.log('[AUTH DEBUG] Nonce generated:', nonce);

    return new NextResponse(nonce, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[AUTH DEBUG] Error generating nonce:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
