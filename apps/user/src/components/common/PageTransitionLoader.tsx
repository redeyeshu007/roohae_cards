/**
 * FILE PURPOSE:
 * Dynamic client-only loader for the WebGL page transition canvas.
 *
 * MAIN RESPONSIBILITY:
 * Dynamically imports PageTransitionCanvas with ssr: false and excludes it on /login and /register routes.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/common/PageTransitionCanvas.tsx
 * - apps/user/src/app/layout.tsx
 */

"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const PageTransitionCanvas = dynamic(
  () => import("./PageTransitionCanvas"),
  { ssr: false }
);

/**
 * PageTransitionLoader — mounts the Three.js page-transition canvas.
 * Client-only, loaded lazily to keep the initial bundle lean.
 */
export function PageTransitionLoader() {
  const pathname = usePathname();
  
  // Disable transition canvas on authentication pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return <PageTransitionCanvas />;
}
