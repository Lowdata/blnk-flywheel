import { SessionOptions } from 'iron-session';

export interface SessionData {
  nonce?: string;
  siwe?: {
    address: string;
    chainId: number;
  };
}

const secretCookiePassword = process.env.SECRET_COOKIE_PASSWORD || process.env.SESSION_PASSWORD;

if (!secretCookiePassword || secretCookiePassword.length < 32) {
  throw new Error(
    'SECRET_COOKIE_PASSWORD (or SESSION_PASSWORD) environment variable must be set and at least 32 characters long to secure session encryption.'
  );
}

export const sessionOptions: SessionOptions = {
  password: secretCookiePassword,
  cookieName: 'blnk_siwe',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

