/**
 * FILE PURPOSE:
 * Users administration table for admin inside user app.
 *
 * MAIN RESPONSIBILITY:
 * Lists all registered user accounts with role badges, joined timestamps, last login dates,
 * and active/inactive status toggle switches.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/lib/admin-queries.ts (useUsers, useSetUserActive)
 * - apps/api/src/modules/users/users.routes.ts
 */

'use client';

import { useState } from 'react';
import { Search, Users as UsersIcon } from 'lucide-react';
import { Badge, Card, EmptyState, Input, Skeleton, Switch } from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import { useSetUserActive, useUsers } from '@/lib/admin-queries';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  // API QUERIES & MUTATIONS:
  // Fetches users and toggles active status
  const { data, isLoading } = useUsers(search);
  const setActiveMutation = useSetUserActive();

  return (
    <>
      <PageHeader 
        title="Users" 
        description="Everyone with access to the platform." 
        breadcrumb="Admin / Users"
      />

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6B6B]" />
          <Input
            placeholder="Search by name or email…"
            className="pl-11 h-11 rounded-full bg-[#FFFDF9] border-none shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-[#E7DDD6] bg-[#FFFDF9] rounded-3xl shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data?.items.length ? (
            <EmptyState
              icon={<UsersIcon className="h-10 w-10" />}
              title="No users found"
              className="m-6"
            />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E7DDD6] text-[11px] uppercase tracking-wider font-secondary text-[#6B6B6B]">
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium">Last sign-in</th>
                  <th className="px-6 py-4 text-right font-medium">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DDD6]/60">
                {data.items.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-[#F8F4EF]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F4EF] text-sm font-semibold text-[#1F1F1F]">
                          {user.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-primary text-[14px] font-medium text-[#1F1F1F]">{user.name}</p>
                          <p className="text-[12px] font-secondary text-[#6B6B6B] mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'muted'} className="capitalize">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-secondary text-[#6B6B6B]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-secondary text-[#6B6B6B]">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* TOGGLE SWITCH:
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
