'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Bell, FolderHeart, Home, LogOut, UserRound } from 'lucide-react';
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
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/projects', label: 'My Designs', icon: FolderHeart },
] as const;

export function UserShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, clear } = useAuthStore();

  useEffect(() => {
    if (hydrated && !user) router.replace('/login');
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex h-screen flex-col bg-[#F8F4EF]">
        <div className="h-[72px] border-b border-[#E7DDD6] bg-[#FFFDF9]" />
        <div className="mx-auto w-full max-w-7xl px-8 py-10 space-y-4">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <div className="grid grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F4EF]">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-30 border-b border-[#E7DDD6] bg-[#FFFDF9]/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-6 px-8">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="Roohae"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Divider */}
          <div className="h-6 w-px bg-[#E7DDD6]" />

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] font-medium transition-all duration-200',
                    active
                      ? 'bg-[#F8F4EF] text-[#1F1F1F] shadow-sm border border-[#E7DDD6]'
                      : 'text-[#6B6B6B] hover:bg-[#F8F4EF] hover:text-[#1F1F1F]',
                  )}
                >
                  <Icon className={cn('h-4 w-4', active ? 'text-[#C5A572]' : 'text-[#6B6B6B]')} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: notifications + profile */}
          <div className="ml-auto flex items-center gap-3">
            {/* Bell */}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E7DDD6] bg-white/60 text-[#6B6B6B] transition-colors hover:bg-white hover:shadow-sm">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#C5A572] ring-2 ring-white" />
            </button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-[#E7DDD6] bg-white/60 p-1 pr-3.5 transition-all hover:bg-white hover:shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F4EF] text-[13px] font-semibold text-[#1F1F1F]">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-[100px] truncate text-[13px] font-medium text-[#1F1F1F]">
                  {user.name.split(' ')[0]}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <div className="px-3 py-2.5">
                  <p className="truncate text-[14px] font-medium text-[#1F1F1F]">{user.name}</p>
                  <p className="truncate text-[12px] text-[#6B6B6B]">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/projects')}>
                  <UserRound className="h-4 w-4" /> My Designs
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
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-8 py-10">
        {children}
      </main>
    </div>
  );
}
