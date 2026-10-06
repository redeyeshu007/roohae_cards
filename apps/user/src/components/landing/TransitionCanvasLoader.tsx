/**
 * FILE PURPOSE:
 * Dynamic client-side loader for the landing page material gradient transition canvas.
 *
 * MAIN RESPONSIBILITY:
 * Dynamically imports MaterialTransitionCanvas with SSR disabled to prevent server-side WebGL evaluation.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/MaterialTransitionCanvas.tsx
 * - apps/user/src/app/page.tsx
 */

"use client";

import dynamic from "next/dynamic";

const MaterialTransitionCanvas = dynamic(
  () => import("./MaterialTransitionCanvas"),
  { ssr: false }
);

export function TransitionCanvasLoader() {
  return <MaterialTransitionCanvas />;
}
