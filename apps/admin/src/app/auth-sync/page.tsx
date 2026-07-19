'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function SyncContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const payloadParam = searchParams.get('payload');
    if (payloadParam) {
      try {
        const decoded = JSON.parse(atob(payloadParam));
        if (decoded.user && decoded.tokens) {
          setSession(decoded.user, decoded.tokens);
          router.replace('/dashboard');
          return;
        }
      } catch (err) {
        console.error('Failed to parse auth payload', err);
      }
    }
    
    // Fallback if payload is invalid or missing
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
