/**
 * FILE PURPOSE:
 * Admin login redirect page.
 *
 * MAIN RESPONSIBILITY:
 * Redirects admin login requests to the centralized user authentication portal.
 *
 * CONNECTED SYSTEMS:
 * - apps/user login portal (http://localhost:3001/login)
 * - apps/admin/src/app/auth-sync/page.tsx (Return target after successful login)
 */

import { redirect } from 'next/navigation';

export default function AdminLoginPage() {
  // NAVIGATION:
  // Redirects unauthenticated admin users to centralized SSO/login application
  redirect('http://localhost:3001/login');
}
