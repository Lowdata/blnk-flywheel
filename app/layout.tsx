import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Press_Start_2P, VT323, Silkscreen, Inter, Montserrat } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixel',
});

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-retro',
});

const silkscreen = Silkscreen({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-silkscreen',
});

export const metadata = {
  title: 'BLNK',
  description: 'Black to ink',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${montserrat.variable} ${pressStart2P.variable} ${vt323.variable} ${silkscreen.variable}`}
    >
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        {process.env.VERCEL === '1' && <Analytics />}
        {process.env.VERCEL === '1' && <SpeedInsights />}
      </body>
    </html>
  );
}
