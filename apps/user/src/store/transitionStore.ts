/**
 * FILE PURPOSE:
 * Zustand state store coordinating multi-stage WebGL/canvas page transition animations.
 *
 * MAIN RESPONSIBILITY:
 * Manages the lifecycle phases ("idle" -> "covering" -> "covered" -> "revealing")
 * and target destination URL for seamless liquid/paper shader scene transitions.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/common/TransitionLink.tsx
 * - apps/user/src/components/common/PageTransitionCanvas.tsx
 * - apps/user/src/hooks/usePageTransition.ts
 */

import { create } from "zustand";

type Phase = "idle" | "covering" | "covered" | "revealing";

interface TransitionStore {
  phase: Phase;
  href: string | null;
  /** Called by TransitionLink — start the cover animation */
  startTransition: (href: string) => void;
  /** Called by the canvas once the cover animation completes */
  onCoverComplete: () => void;
  /** Called by the canvas once the reveal animation completes */
  onRevealComplete: () => void;
  /** Called by the router after navigation to begin reveal */
  beginReveal: () => void;
}

export const useTransitionStore = create<TransitionStore>((set) => ({
  phase: "idle",
  href: null,

  startTransition: (href) => set({ phase: "covering", href }),

  onCoverComplete: () => set({ phase: "covered" }),

  beginReveal: () => set({ phase: "revealing" }),

  onRevealComplete: () => set({ phase: "idle", href: null }),
}));
