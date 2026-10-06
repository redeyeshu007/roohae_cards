/**
 * FILE PURPOSE:
 * Root layout component for the Roohae Admin Next.js web application.
 *
 * MAIN RESPONSIBILITY:
 * Configures the HTML document structure, global CSS styles, page title metadata,
 * and wraps all pages with AppProviders (React Query, theme, and Sonner toast system).
 *
 * CONNECTED SYSTEMS:
 * - packages/ui/src/lib/providers.tsx (AppProviders)
 * - apps/admin/src/app/globals.css (Global styles)
 */

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
