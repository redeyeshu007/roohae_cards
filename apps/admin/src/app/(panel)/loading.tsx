/**
 * FILE PURPOSE:
 * Suspense loading fallback indicator for admin panel sub-routes.
 *
 * MAIN RESPONSIBILITY:
 * Displays a centered spinner while server-rendered or lazy-loaded panel pages hydrate.
 *
 * CONNECTED SYSTEMS:
 * - Next.js App Router streaming boundary for (panel) route group
 */

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-300 dark:text-slate-700" />
    </div>
  );
}
