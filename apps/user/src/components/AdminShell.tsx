/**
 * FILE PURPOSE:
 * Navigation shell and sidebar layout for admin control views embedded within the user application.
 *
 * MAIN RESPONSIBILITY:
 * Provides the persistent navigation frame for /admin/* pages, verifies administrator role
 * from the user auth store, and handles sign-out and profile routing.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/lib/api.ts (useAuthStore)
 * - apps/user/src/app/admin/(panel)/* routes
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
  Sparkles,
  Type,
  UploadCloud,
  UserRound,
  Search,
  Bell,
} from 'lucide-react';
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
  Tip,
} from '@roohae/ui';
import { useAuthStore } from '@/lib/api';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/admin/uploads', label: 'Uploads', icon: UploadCloud },
  { href: '/admin/fonts', label: 'Fonts', icon: Type },
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
        <div className="w-72 border-r border-[#E7DDD6] p-4">
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
    <div className="flex h-screen overflow-hidden bg-[#F8F4EF]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#E7DDD6] bg-[#FFFDF9]">
        <Link href="/admin/dashboard" className="flex items-center gap-3 px-6 py-6">
          <img
            src="/logo.png"
            alt="Roohae"
            className="h-14 w-auto object-contain"
          />
          <span className="block text-[14px] font-secondary font-semibold tracking-widest uppercase text-[#6B6B6B]">Admin</span>
        </Link>

        <nav className="flex-1 space-y-1.5 px-4 py-2 mt-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3.5 rounded-xl px-4 py-3 text-[14px] font-medium transition-all duration-200 border-l-[3px] border-transparent',
                  active
                    ? 'bg-[#F8F4EF] text-[#1F1F1F] shadow-sm !border-[#C5A572]'
                    : 'text-[#6B6B6B] hover:bg-[#F8F4EF] hover:text-[#1F1F1F]',
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-[#C5A572]" : "text-[#6B6B6B]")} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-72 min-h-0 overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#E7DDD6] bg-[#FFFDF9] px-8">
          {/* Search Placeholder */}
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Search users, templates, categories..."
              className="h-11 w-full rounded-full border border-[#E7DDD6] bg-white/50 pl-11 pr-4 text-[14px] text-[#1F1F1F] placeholder:text-[#6B6B6B] focus:border-[#C5A572] focus:outline-none focus:ring-2 focus:ring-[#C98B9E]/30 transition-all hover:bg-white"
            />
          </div>

          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <Tip label="Notifications (Coming Soon)">
              <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#E7DDD6] bg-white/50 text-[#1F1F1F] transition-colors hover:bg-white hover:shadow-sm">
                <Bell className="h-5 w-5 text-[#6B6B6B]" />
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#C5A572] ring-2 ring-white"></span>
              </button>
            </Tip>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 rounded-full border border-[#E7DDD6] bg-white/50 p-1 pr-4 text-left transition-colors hover:bg-white hover:shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8F4EF] text-[14px] font-semibold text-[#1F1F1F]">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-[#1F1F1F]">{user.name}</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56 mt-2">
                <div className="px-3 py-2.5">
                  <span className="block truncate text-[14px] font-medium text-[#1F1F1F]">{user.name}</span>
                  <span className="block truncate text-[12px] text-[#6B6B6B]">{user.email}</span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/admin/profile')}>
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
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-8 py-10">
          <div className="max-w-[1400px] w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        {breadcrumb && (
          <p className="mb-2 text-[12px] font-secondary tracking-wide uppercase text-[#6B6B6B]">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-[32px] font-primary font-medium tracking-tight text-[#1F1F1F]">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-[#6B6B6B] max-w-2xl leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
