import type { Metadata } from 'next';
import { AppProviders } from '@roohae/ui';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Roohae Cards — Admin', template: '%s · Roohae Admin' },
  description: 'Design platform administration console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
