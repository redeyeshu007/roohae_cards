/**
 * FILE PURPOSE:
 * 3D paper leaf rotation and dynamic specular shading component for the interactive book.
 *
 * MAIN RESPONSIBILITY:
 * Uses Framer Motion transform physics to flip leaves along the spine axis, applying
 * gradient specular highlights and shadows according to the leaf's active rotation angle.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/hero/book/Book.tsx
 * - apps/user/src/components/landing/hero/book/timing.ts
 */

"use client";

import React, { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";

/** Paper: leaves the spine willingly, settles on a long tail. */
const PAGE_EASE = [0.4, 0.0, 0.2, 1.0] as const;

/** The cover: reluctant at the start — it has weight to overcome — then the
 *  same long settle. One curve, not eight; a keyframed easeInOut per segment
 *  is what made this stutter. */
const COVER_EASE = [0.5, 0.0, 0.18, 1.0] as const;

interface PageTurnProps {
  isOpen: boolean;
  zOffset: number;
  /** ms to swing open, and to swing back. Paper closes faster than it opens. */
  openMs: number;
  closeMs: number;
  front: React.ReactNode;
  back: React.ReactNode;
  isCover?: boolean;
}

/** -----------------------------------
 * Shading
 *
 * The curl shadow and the sheen live *inside* their face wrapper rather than
 * beside it. The wrapper isn't preserve-3d, so its children flatten into one
 * paint and stack by DOM order — coplanar siblings in the 3d subtree z-fight,
 * which is what made the turning page flicker.
 *
 * `isolate` keeps the page's own mix-blend layers blending against the page and
 * not against whatever leaf happens to be behind it mid-turn.
 * ----------------------------------- */
function Shading({
  darken,
  sheen,
  mirrored,
}: {
  darken: MotionValue<number>;
  sheen: MotionValue<number>;
  mirrored: boolean;
}) {
  const away = mirrored ? "left" : "right";
  const toward = mirrored ? "right" : "left";

  return (
    <>
      {/* Light falls off toward the fore-edge as the leaf swings away. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: darken,
          background: `linear-gradient(to ${away}, rgba(30,20,10,0) 0%, rgba(30,20,10,0.34) 62%, rgba(30,20,10,0.5) 100%)`,
        }}
      />
      {/* Warm specular riding across the sheet. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: sheen,
          background: `linear-gradient(to ${toward}, rgba(255,248,220,0) 0%, rgba(255,248,220,0.17) 50%, rgba(255,248,220,0) 100%)`,
        }}
      />
    </>
  );
}

export function PageTurn({
  isOpen,
  zOffset,
  openMs,
  closeMs,
  front,
  back,
  isCover,
}: PageTurnProps) {
  const reduced = useReducedMotion();

  // The angle is the single source of truth. Shading reads from it, so the two
  // can never drift apart the way two independently-timed animations do.
  const angle = useMotionValue(isOpen ? -180 : 0);

  // Promoting a leaf costs a GPU layer, so only pay for it while the leaf is
  // actually moving. Held on a motion value rather than state: it must be set
  // *before* the animation starts, and it must not cost a React render.
  const willChange = useMotionValue("auto");

  useEffect(() => {
    const to = isOpen ? -180 : 0;

    // Already there — most importantly on mount, where every leaf would
    // otherwise spin up a full-duration frame loop from 0 to 0 and write
    // transforms for a second and a half while the page is still hydrating.
    if (angle.get() === to) return;

    if (reduced) {
      angle.set(to);
      return;
    }

    willChange.set("transform");
    const controls = animate(angle, to, {
      duration: (isOpen ? openMs : closeMs) / 1000,
      ease: isCover ? COVER_EASE : PAGE_EASE,
      onComplete: () => willChange.set("auto"),
    });

    // Interrupting mid-turn resumes from the current angle rather than
    // snapping — the loop can restart at any point without a jump.
    return () => controls.stop();
  }, [isOpen, openMs, closeMs, isCover, reduced, angle, willChange]);

  // Both read straight off the angle: nothing to fall out of sync with, and no
  // shading at all while the leaf lies flat at either end.
  const darken = useTransform(angle, [0, -90, -180], [0, 0.5, 0]);
  // Held across the edge-on window, so the highlight sweeps rather than blinks.
  const sheen = useTransform(angle, [0, -70, -110, -180], [0, 0.85, 0.85, 0]);

  const faceBase: React.CSSProperties = {
    backfaceVisibility: "hidden",
    isolation: "isolate",
  };

  return (
    <motion.div
      className="absolute top-0 left-1/2 w-1/2 h-full"
      style={{
        transformOrigin: "0% 50%",
        transformStyle: "preserve-3d",
        rotateY: angle,
        willChange,
      }}
    >
      {/* The stack offset has to be nested inside the rotation, not listed
          beside it. `translateZ(z) rotateY(180deg)` composes as T·R: the sheet
          rotates, but the translate still lands in the parent's frame, so it
          stays at +z however far it swings. The cover carries the largest
          offset, so once open it sits nearest the viewer and buries every page
          turned onto it. Nested, the offset rotates with the leaf — a sheet
          resting +z above the stack on the right lands -z beneath it on the
          left, which is how a book actually restacks. */}
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: `translateZ(${zOffset}px)`,
        }}
      >
        <div className="absolute inset-0" style={faceBase}>
          {front}
          <Shading darken={darken} sheen={sheen} mirrored={false} />
        </div>

        <div
          className="absolute inset-0"
          style={{ ...faceBase, transform: "rotateY(180deg)" }}
        >
          {back}
          <Shading darken={darken} sheen={sheen} mirrored />
        </div>
      </div>
    </motion.div>
  );
}
