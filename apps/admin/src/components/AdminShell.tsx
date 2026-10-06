/**
 * FILE PURPOSE:
 * Core layout container and navigation sidebar for the Roohae admin control panel.
 *
 * MAIN RESPONSIBILITY:
 * Renders the persistent admin navigation menu (Dashboard, Categories, Templates, Uploads, Fonts, Users, Settings),
 * verifies admin role authorization from the auth store, and provides user dropdown sign-out actions.
 *
 * CONNECTED SYSTEMS:
 * - apps/admin/src/lib/api.ts (useAuthStore for session validation and sign-out)
 * - apps/admin/src/app/(panel)/layout.tsx (wraps all panel route pages)
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import {
  FolderOpen,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Settings,
  Sparkles,
  Type,
  UploadCloud,
  UserRound,
  Users,
} from 'lucide-react';
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
} from '@roohae/ui';
import { useAuthStore } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/categories', label: 'Categories', icon: FolderOpen },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/uploads', label: 'Uploads', icon: UploadCloud },
  { href: '/fonts', label: 'Fonts', icon: Type },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, clear } = useAuthStore();

  useEffect(() => {
    if (hydrated && (!user || user.role !== 'admin')) router.replace('/login');
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen">
        <div className="w-64 border-r border-slate-200 p-4 dark:border-slate-800">
          <Skeleton className="mb-6 h-10 w-full" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-9 w-full" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-soft">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span>
            <span className="block text-sm font-bold leading-tight">Roohae Cards</span>
            <span className="block text-[11px] text-slate-400">Admin console</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{user.name}</span>
                <span className="block truncate text-xs text-slate-400">{user.email}</span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem onSelect={() => router.push('/profile')}>
                <UserRound className="h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onSelect={() => {
                  clear();
                  router.replace('/');
                }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-64 min-h-screen flex-1 p-8">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
