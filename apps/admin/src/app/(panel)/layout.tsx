/**
 * FILE PURPOSE:
 * Administrative control panel wrapper layout.
 *
 * MAIN RESPONSIBILITY:
 * Wraps all (panel) group route children inside the AdminShell navigation sidebar
 * and auth verification boundary.
 *
 * CONNECTED SYSTEMS:
 * - apps/admin/src/components/AdminShell.tsx (AdminShell container)
 * - apps/admin/src/app/(panel)/* (All administrative pages)
 */

import { AdminShell } from '@/components/AdminShell';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
