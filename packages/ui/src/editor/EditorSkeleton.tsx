'use client';

import { Loader2 } from 'lucide-react';
import { Skeleton } from '../components/basics';

/**
 * Full-workspace loading state shown while template JSON, assets and fonts
 * are being prepared. The Fabric canvas is never mounted before everything
 * is ready — users never see a blank white canvas.
 */
export function EditorSkeleton({ label = 'Preparing your design…' }: { label?: string }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="mx-auto h-8 w-56" />
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar rail + drawer */}
        <div className="flex w-[72px] flex-col items-center gap-3 border-r border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-14" />
          ))}
        </div>
        <div className="w-72 space-y-3 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>

        {/* Canvas stage */}
        <div className="relative flex min-w-0 flex-1 items-center justify-center p-10">
          <Skeleton className="aspect-[3/4] h-full max-h-[70vh] rounded-none shadow-float" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            <p className="text-sm font-medium text-slate-500">{label}</p>
          </div>
        </div>
      </div>

      {/* Pages bar */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-7" />
        <Skeleton className="ml-auto h-7 w-24" />
      </div>
    </div>
  );
}
