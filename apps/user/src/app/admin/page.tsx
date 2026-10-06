/**
 * FILE PURPOSE:
 * Admin root route redirect handler within the user application.
 *
 * MAIN RESPONSIBILITY:
 * Redirects visitors hitting /admin to the admin dashboard route (/admin/dashboard).
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/app/admin/(panel)/dashboard/page.tsx
 */

import { redirect } from 'next/navigation';

export default function AdminPage() {
  // NAVIGATION:
  // Redirects to admin dashboard index
  redirect('/admin/dashboard');
}
