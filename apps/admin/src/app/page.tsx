/**
 * FILE PURPOSE:
 * Root admin entry route redirect handler.
 *
 * MAIN RESPONSIBILITY:
 * Evaluates admin session hydration state and redirects to either
 * /dashboard (if authenticated) or /login (if unauthenticated).
 *
 * CONNECTED SYSTEMS:
 * - apps/admin/src/lib/api.ts (useAuthStore)
 * - apps/admin/src/app/(panel)/dashboard/page.tsx (/dashboard)
 * - apps/admin/src/app/login/page.tsx (/login)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/api';

export default function IndexPage() {
  const router = useRouter();
  // AUTH STATE:
  // Reads hydrated session and user authentication profile
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    // HYDRATION CHECK:
    // Await localStorage store hydration before performing routing redirect
    if (!hydrated) return;
    // ROUTING:
    // Route user to /dashboard if logged in or /login if not authenticated
    router.replace(user ? '/dashboard' : '/login');
  }, [hydrated, user, router]);

  return null;
}
