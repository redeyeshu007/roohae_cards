/**
 * FILE PURPOSE:
 * 3D Open Book spread structure managing Verso and Recto pages and folding covers.
 *
 * MAIN RESPONSIBILITY:
 * Mounts 3D CSS perspective container, manages thickness layering, spine shadows,
 * and passes step rotation values to PageTurn leaves.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/hero/book/Book.tsx
 * - apps/user/src/components/landing/hero/book/PageTurn.tsx
 */

import React from "react";
import { SPREADS, FINALE, type PageData } from "./pages";
import { Cover } from "./Cover";
import { Page } from "./Page";
import { Writing } from "./Writing";
import { Details } from "./Details";
import { PageTurn } from "./PageTurn";
import { COVER_TURN_MS, PAGE_CLOSE_MS, PAGE_TURN_MS } from "./timing";

const SHEET_THICKNESS = 1.5;
const COVER_BG = "linear-gradient(160deg, #3A2C1E 0%, #2A1F14 50%, #1E1510 100%)";

/** Right-hand page of a spread: the supporting matter, and the decoration. */
function Recto({ page }: { page: PageData }) {
  return (
    <div className="absolute inset-0">
      <Page color={page.paperColor} spine="left" />
      {!page.isBlank && (
        <>
          <Details type={page.detail} accentColor={page.accentColor} />
          <Writing page={page} side="recto" />
        </>
      )}
    </div>
  );
}

/** Left-hand page of a spread: the tag and the display title. */
function Verso({ page }: { page: PageData }) {
  return (
    <div className="absolute inset-0">
      <Page color={page.paperColor} spine="right" />
      <Writing page={page} side="verso" />
    </div>
  );
}

interface OpenBookProps {
  step: number;
}

export function OpenBook({ step }: OpenBookProps) {
  // Leaf 0 is the cover; leaves 1..SPREADS.length-1 are the sheets.
  const leavesCount = SPREADS.length;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ perspective: 1800 }}
      aria-hidden="true"
    >
      <div className="relative h-[60%] aspect-[1.44/1] max-w-full">
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>

          {/*
            1. Static back-cover board.
            Always sits on the right half (left-1/2), at the deepest Z-level.
            This forms the bottom of the right-side page stack.
            Notice there is NO left board. The left side is created dynamically
            as the leaves rotate onto it, bottom-most first.
          */}
          <div
            className="absolute top-0 left-1/2 w-1/2 h-full rounded-r-[3px]"
            style={{
              transform: `translateZ(-${leavesCount * SHEET_THICKNESS + 2}px)`,
              background: COVER_BG,
              boxShadow: "12px 24px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div className="absolute inset-0 paper-texture opacity-25 mix-blend-overlay" />
            <div
              className="absolute inset-y-0 left-0 w-[12%]"
              style={{
                background:
                  "linear-gradient(to right, rgba(40,30,20,0.5), rgba(40,30,20,0))",
              }}
            />
          </div>

          {/*
            2. Page Block Thickness.
            Sits just above the back cover, creating the visual edge of 100+ pages.
          */}
          <div
            className="absolute top-0 left-1/2 w-[calc(50%-2px)] h-[calc(100%-4px)] mt-[2px]"
            style={{
              transform: `translateZ(-${leavesCount * SHEET_THICKNESS + 1}px)`,
              background: "#F8F5EE",
              boxShadow: "inset -2px 0 6px rgba(0,0,0,0.1), inset 0 0 12px rgba(180,160,130,0.2)",
              borderRight: "1px solid rgba(0,0,0,0.05)",
              backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)",
            }}
          />

          {/*
            3. Static right board — the recto of the last spread (the finale).
            Sits on top of the page block, below all turning leaves. It is the
            page every other leaf uncovers.
          */}
          <div className="absolute top-0 left-1/2 w-1/2 h-full">
            <Recto page={FINALE} />
          </div>

          {/*
            4. Leaf 0: the front cover. Its back is the pastedown — the dark
            board you see inside a shut book, not a page.
          */}
          <PageTurn
            isOpen={step >= 0}
            zOffset={leavesCount * SHEET_THICKNESS}
            isCover={true}
            openMs={COVER_TURN_MS}
            closeMs={COVER_TURN_MS}
            front={<Cover />}
            back={
              <div className="absolute inset-0 overflow-hidden rounded-l-[3px]" style={{ background: COVER_BG }}>
                <div className="absolute inset-0 paper-texture opacity-25 mix-blend-overlay" />
                <div
                  className="absolute inset-y-0 right-0 w-[12%]"
                  style={{
                    background:
                      "linear-gradient(to left, rgba(0,0,0,0.6), rgba(0,0,0,0))",
                  }}
                />
              </div>
            }
          />

          {/*
            5. Leaves 1+. Each sheet carries two different spreads — the recto
            of the one it is covering on its front, and the verso of the one it
            reveals on its back. That is what makes a spread whole: at step k
            you are looking at the back of leaf k and the front of leaf k+1.
          */}
          {SPREADS.slice(1).map((_, index) => {
            const leafIndex = index + 1;
            const recto = SPREADS[leafIndex - 1];
            const verso = SPREADS[leafIndex];
            const z = (leavesCount - leafIndex) * SHEET_THICKNESS;

            return (
              <PageTurn
                key={verso.id}
                isOpen={step >= leafIndex}
                zOffset={z}
                openMs={PAGE_TURN_MS}
                closeMs={PAGE_CLOSE_MS}
                front={<Recto page={recto} />}
                back={<Verso page={verso} />}
              />
            );
          })}

        </div>
      </div>
    </div>
  );
}
