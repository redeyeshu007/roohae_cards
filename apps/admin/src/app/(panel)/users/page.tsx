/**
 * FILE PURPOSE:
 * Registered user accounts management page for Roohae Admin.
 *
 * MAIN RESPONSIBILITY:
 * Lists all platform users with roles, joined timestamps, last sign-in dates, and active status switches;
 * provides instant toggle mutation for activating/deactivating accounts.
 *
 * CONNECTED SYSTEMS:
 * - apps/admin/src/lib/queries.ts (useUsers, useSetUserActive)
 * - apps/api/src/modules/users/users.routes.ts
 * - apps/admin/src/components/AdminShell.tsx (PageHeader)
 */

'use client';

import { useState } from 'react';
import { Search, Users as UsersIcon } from 'lucide-react';
import { Badge, Card, EmptyState, Input, Skeleton, Switch } from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import { useSetUserActive, useUsers } from '@/lib/queries';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  // API QUERIES & MUTATIONS:
  // Fetches user records and handles active status toggle
  const { data, isLoading } = useUsers(search);
  const setActiveMutation = useSetUserActive();

  return (
    <>
      <PageHeader title="Users" description="Everyone with access to the platform." />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={<UsersIcon className="h-8 w-8" />}
            title="No users found"
            className="m-6"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium">Last sign-in</th>
                  <th className="px-6 py-3 text-right font-medium">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.items.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                          {user.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={user.role === 'admin' ? 'default' : 'muted'} className="capitalize">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {/* SWITCH / TOGGLE:
                          Toggles user active state (PATCH /api/v1/users/:id/active) */}
                      <Switch
                        checked={user.isActive}
                        disabled={user.role === 'admin'}
                        onCheckedChange={(isActive) =>
                          setActiveMutation.mutate({ id: user.id, isActive })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
