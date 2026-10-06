/**
 * FILE PURPOSE:
 * Admin panel shell wrapper layout in user application.
 *
 * MAIN RESPONSIBILITY:
 * Wraps all embedded admin panel route children with AdminShell sidebar and authorization guard.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/AdminShell.tsx
 */

import { AdminShell } from '@/components/AdminShell';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
