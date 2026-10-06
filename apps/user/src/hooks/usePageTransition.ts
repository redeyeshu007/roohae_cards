/**
 * FILE PURPOSE:
 * Custom React hook for triggering animated shader page navigation.
 *
 * MAIN RESPONSIBILITY:
 * Exposes a navigate(href) helper that initiates the Three.js cover animation sequence
 * before completing client-side Next.js route transitions.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/store/transitionStore.ts
 * - apps/user/src/components/common/PageTransitionCanvas.tsx
 */

"use client";

import { useCallback } from "react";
import { useTransitionStore } from "@/store/transitionStore";

/**
 * usePageTransition — returns a `navigate(href)` function that:
 * 1. Triggers the Three.js cover animation via the store
 *
 * The canvas handles the actual router.push() once fully covered.
 */
export function usePageTransition() {
  const startTransition = useTransitionStore((s) => s.startTransition);

  const navigate = useCallback(
    (href: string) => {
      startTransition(href);
    },
    [startTransition]
  );

  return { navigate };
}
