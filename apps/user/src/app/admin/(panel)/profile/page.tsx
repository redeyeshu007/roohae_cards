/**
 * FILE PURPOSE:
 * Admin user profile settings page inside user app.
 *
 * MAIN RESPONSIBILITY:
 * Allows admin to update display name and change login password, syncing changes
 * to the Zustand auth store and invalidating other active sessions.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/lib/api.ts (api client and useAuthStore)
 * - apps/api/src/modules/auth/auth.routes.ts (PATCH /auth/profile, POST /auth/change-password)
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { User } from '@roohae/shared';
import { apiErrorMessage, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import { api, useAuthStore } from '@/lib/api';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // SAVE NAME HANDLER:
  // Updates profile name -> PATCH /auth/profile -> updates useAuthStore
  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    try {
      const res = await api.patch<{ success: true; data: User }>('/auth/profile', { name });
      setUser(res.data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingName(false);
    }
  }

  // CHANGE PASSWORD HANDLER:
  // Changes password credentials -> POST /auth/change-password
  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed — other sessions were signed out');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <PageHeader title="Profile" description="Your account details." />
      <div className="grid max-w-3xl grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ''} disabled />
              </div>
              {/* BUTTON:
                  Submit name changes */}
              <Button type="submit" loading={savingName}>
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              {/* BUTTON:
                  Submit password update */}
              <Button type="submit" variant="secondary" loading={savingPassword}>
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
