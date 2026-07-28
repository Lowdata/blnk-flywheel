import { SessionOptions } from 'iron-session';

export interface SessionData {
  nonce?: string;
  siwe?: {
    address: string;
    chainId: number;
  };
}

export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD || 'complex_password_at_least_32_characters_long_for_iron_session',
  cookieName: 'blnk_siwe',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
