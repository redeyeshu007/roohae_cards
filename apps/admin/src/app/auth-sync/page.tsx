/**
 * FILE PURPOSE:
 * Cross-application authentication synchronization endpoint.
 *
 * MAIN RESPONSIBILITY:
 * Decodes the base64 URL payload parameter from the user app login flow,
 * injects user object and JWT tokens into useAuthStore, and forwards to /dashboard.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/app/login/page.tsx (Encodes payload and redirects here)
 * - apps/admin/src/lib/api.ts (useAuthStore.setSession)
 * - apps/admin/src/app/(panel)/dashboard/page.tsx (/dashboard)
 */

'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function SyncContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // AUTH STORE:
  // Injects decoded user session and JWT access/refresh tokens
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const payloadParam = searchParams.get('payload');
    if (payloadParam) {
      try {
        // PAYLOAD DECODING:
        // Decodes URL query string parameter into JSON credentials
        const decoded = JSON.parse(atob(payloadParam));
        if (decoded.user && decoded.tokens) {
          // STATE UPDATE:
          // Persists user and token credentials to local admin auth store
          setSession(decoded.user, decoded.tokens);
          // NAVIGATION:
          // Forwards authenticated admin to main dashboard
          router.replace('/dashboard');
          return;
        }
      } catch (err) {
        console.error('Failed to parse auth payload', err);
      }
    }
    
    // Fallback if payload is invalid or missing
    // NAVIGATION:
    // If validation fails, redirects back to central login portal
    window.location.replace('http://localhost:3001/login');
  }, [searchParams, router, setSession]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <span className="ml-3 text-lg font-medium">Syncing session...</span>
    </div>
  );
}

export default function AuthSyncPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></div>}>
      <SyncContent />
    </Suspense>
  );
}
