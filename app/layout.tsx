import { Providers } from './providers';
import Spotlight from '@/components/Spotlight';
import './globals.css';

export const metadata = {
  title: 'BLNK Claw Machine',
  description: 'The Whitelist Flywheel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Spotlight />
          {children}
        </Providers>
      </body>
    </html>
  );
}
