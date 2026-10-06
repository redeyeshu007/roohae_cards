'use client';

/**
 * FILE PURPOSE:
 * Root client context providers wrapper.
 *
 * MAIN RESPONSIBILITY:
 * Configures and mounts TanStack React Query client with 5-minute stale cache defaults,
 * Radix UI TooltipProvider, and Sonner toast notification provider.
 *
 * CONNECTED SYSTEMS:
 * - apps/admin/src/app/layout.tsx (wraps entire admin app)
 * - apps/user/src/app/layout.tsx (wraps entire user app)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';

// GLOBAL APP PROVIDERS:
// Initializes shared React Query cache and UI notification/tooltip contexts.
export function AppProviders({ children }: { children: ReactNode }) {
  // REACT QUERY CLIENT:
  // Configured with 5-min staleTime and disabled aggressive window refetches for design editor stability.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 15 * 60 * 1000, // 15 minutes
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
      <Toaster richColors position="bottom-right" />
    </QueryClientProvider>
  );
}
