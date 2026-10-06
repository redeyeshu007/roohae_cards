/**
 * FILE PURPOSE:
 * Authenticated user application route group layout.
 *
 * MAIN RESPONSIBILITY:
 * Wraps user pages (/dashboard, /projects) inside UserShell top navigation,
 * profile dropdown, and auth verification boundary.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/UserShell.tsx
 * - apps/user/src/app/(app)/dashboard/page.tsx
 * - apps/user/src/app/(app)/projects/page.tsx
 */

import { UserShell } from '@/components/UserShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <UserShell>{children}</UserShell>;
}
