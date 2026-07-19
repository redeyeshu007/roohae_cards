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
