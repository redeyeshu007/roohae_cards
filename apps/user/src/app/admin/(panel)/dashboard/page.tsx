/**
 * FILE PURPOSE:
 * Creative Control Center dashboard page for admin users inside the user application.
 *
 * MAIN RESPONSIBILITY:
 * Fetches platform stats (users, templates, categories, published templates, assets),
 * provides quick navigation action cards, and displays activity metrics.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/lib/admin-queries.ts (useDashboardStats)
 * - apps/user/src/components/AdminShell.tsx (PageHeader)
 * - apps/api/src/modules/dashboard/dashboard.routes.ts
 */

'use client';

import Link from 'next/link';
import {
  FolderOpen,
  Image as ImageIcon,
  LayoutTemplate,
  Palette,
  Type,
  Users,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import { useDashboardStats } from '@/lib/admin-queries';

const STATS = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'templates', label: 'Templates', icon: LayoutTemplate },
  { key: 'categories', label: 'Categories', icon: FolderOpen },
  { key: 'publishedTemplates', label: 'Published', icon: Palette },
  { key: 'assets', label: 'Assets', icon: ImageIcon },
] as const;

const QUICK_ACTIONS = [
  { label: 'New Template', icon: LayoutTemplate, href: '/admin/templates' },
  { label: 'Add Category', icon: FolderOpen, href: '/admin/categories' },
  { label: 'Upload Font', icon: Type, href: '/admin/fonts' },
  { label: 'View Users', icon: Users, href: '/admin/users' },
];

export default function DashboardPage() {
  // API QUERY:
  // Fetches aggregated dashboard metrics via GET /api/v1/dashboard/stats
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Creative Control Center"
        description="Manage templates, categories, users, fonts, and platform operations from one beautifully organized workspace."
        breadcrumb="ROOHAE / ADMIN"
      />

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-[16px] font-primary font-medium tracking-tight text-[#1F1F1F]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="group flex flex-col items-center justify-center gap-3 rounded-3xl border border-[#E7DDD6] bg-[#FFFDF9] p-6 text-center transition-all hover:bg-white hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F4EF] text-[#C5A572] transition-transform group-hover:scale-110">
                <action.icon className="h-5 w-5" />
              </span>
              <span className="text-[14px] font-medium text-[#1F1F1F]">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="mb-4 text-[16px] font-primary font-medium tracking-tight text-[#1F1F1F]">Overview</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {STATS.map(({ key, label, icon: Icon }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ease: 'easeOut', duration: 0.5 }}
            >
              <Card className="group relative overflow-hidden border border-[#E7DDD6] bg-[#FFFDF9] p-5 shadow-sm transition-all hover:bg-white hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F8F4EF] text-[#C5A572] transition-transform group-hover:scale-105">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                
                {isLoading ? (
                  <Skeleton className="mb-1 h-8 w-16 rounded-lg" />
                ) : (
                  <p className="mb-0.5 text-2xl font-primary font-medium tabular-nums tracking-tight text-[#1F1F1F]">
                    {data?.[key] ?? 0}
                  </p>
                )}
                
                <p className="text-[13px] font-secondary tracking-wide text-[#6B6B6B]">{label}</p>
                <p className="mt-2 text-[11px] text-[#6B6B6B] uppercase tracking-wider">Total</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>


    </div>
  );
}
