/**
 * FILE PURPOSE:
 * Navigation link component for page routes in the user application.
 *
 * MAIN RESPONSIBILITY:
 * Wraps Next.js Link primitive to provide a drop-in replacement with transition styling support.
 *
 * CONNECTED SYSTEMS:
 * - Next.js App Router (Link)
 * - apps/user/src/components/*
 */

"use client";

import Link from "next/link";
import { type ReactNode } from "react";

interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * TransitionLink — updated to act as a standard Next.js Link 
 * since the 3D page-transition animation was disabled.
 */
export function TransitionLink({
  href,
  children,
  className,
  style,
}: TransitionLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
    >
      {children}
    </Link>
  );
}
