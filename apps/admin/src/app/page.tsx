'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/api';

export default function IndexPage() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [hydrated, user, router]);

  return null;
}
