'use client';

import {
  FolderOpen,
  Image as ImageIcon,
  LayoutTemplate,
  Palette,
  Type,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import { useDashboardStats } from '@/lib/queries';

const STATS = [
  { key: 'users', label: 'Users', icon: Users, tint: 'from-sky-400 to-sky-600' },
  { key: 'templates', label: 'Templates', icon: LayoutTemplate, tint: 'from-brand-400 to-brand-600' },
  { key: 'publishedTemplates', label: 'Published', icon: Palette, tint: 'from-emerald-400 to-emerald-600' },
  { key: 'categories', label: 'Categories', icon: FolderOpen, tint: 'from-amber-400 to-amber-600' },
  { key: 'assets', label: 'Assets', icon: ImageIcon, tint: 'from-fuchsia-400 to-fuchsia-600' },
  { key: 'fonts', label: 'Fonts', icon: Type, tint: 'from-rose-400 to-rose-600' },
] as const;

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your design platform at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STATS.map(({ key, label, icon: Icon, tint }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-5">
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-soft`}
              >
                <Icon className="h-5 w-5" />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold tabular-nums">{data?.[key] ?? 0}</p>
              )}
              <p className="text-sm text-slate-500">{label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : data?.recentActivity.length ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentActivity.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                        {log.action.replace(/\./g, ' → ')}
                      </p>
                      <p className="text-xs text-slate-400">{log.entityType}</p>
                    </div>
                    <time className="shrink-0 text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">No activity yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User projects</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <p className="text-4xl font-bold tabular-nums">{data?.projects ?? 0}</p>
                <p className="mt-1 text-sm text-slate-500">
                  designs created from your published templates
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
