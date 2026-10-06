/**
 * FILE PURPOSE:
 * Suspense loading fallback for admin routes in user application.
 *
 * MAIN RESPONSIBILITY:
 * Renders a centered spinner during async data fetches and page transitions.
 *
 * CONNECTED SYSTEMS:
 * - Next.js App Router streaming boundary
 */

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-300 dark:text-slate-700" />
    </div>
  );
}
