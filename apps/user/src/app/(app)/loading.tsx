/**
 * FILE PURPOSE:
 * Suspense loading indicator for authenticated user application pages.
 *
 * MAIN RESPONSIBILITY:
 * Displays a centered brand loading spinner while pages stream or data fetches.
 *
 * CONNECTED SYSTEMS:
 * - Next.js App Router streaming boundary for (app) route group
 */

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
    </div>
  );
}
