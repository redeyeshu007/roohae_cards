"use client";

import dynamic from "next/dynamic";

const MaterialTransitionCanvas = dynamic(
  () => import("./MaterialTransitionCanvas"),
  { ssr: false }
);

export function TransitionCanvasLoader() {
  return <MaterialTransitionCanvas />;
}
