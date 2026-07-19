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
