"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { PAGES } from "./pages";
import { OpenBook } from "./OpenBook";
import {
  CLOSE_STAGGER_MS,
  FINALE_PAUSE_MS,
  FLYLEAF_DELAY_MS,
  LOOP_DELAY_MS,
  OPEN_DELAY_MS,
  PAGE_DWELL_MS,
} from "./timing";

/** Index of the last leaf. Leaf 0 is the cover, leaves 1..PAGES.length are the
 *  sheets, and the finale is the board they all uncover. */
const LAST_LEAF = PAGES.length;

/** -----------------------------------
 * Book
 *
 * One number drives everything: `step`, the highest leaf index that has turned.
 *
 *   -1  cover down, book shut
 *    0  cover open
 *   1+  that many sheets turned
 *
 * There is no closed/open swap. At step -1 the spread *is* the closed book —
 * the cover sits over the right half and hides the rest — so the two states are
 * the same DOM and the transition between them is just the cover rotating.
 * ----------------------------------- */
export default function Book() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(-1);
  const [closing, setClosing] = useState(false);

  // Don't start until the page has stopped doing work. Framer drives the turn
  // on the main thread — it writes a transform every frame — so anything
  // hogging that thread shows up directly as a stuttering cover. On load the
  // thread is busy hydrating, swapping in seven webfonts, and running the
  // Masthead's 300px ruler measurement, and a fixed delay lands right on top of
  // it. Waiting for the fonts and then for one idle beat means the book opens
  // into a quiet thread instead of fighting one.
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const go = () => {
      if (!cancelled) setSettled(true);
    };

    const whenIdle = () => {
      if (cancelled) return;
      if (typeof requestIdleCallback === "function") {
        // The timeout is the backstop: on a page that never goes idle we still
        // open, just a beat later.
        idleId = requestIdleCallback(go, { timeout: 1500 });
      } else {
        timerId = setTimeout(go, 300);
      }
    };

    if (document.fonts?.status === "loaded") whenIdle();
    else if (document.fonts) document.fonts.ready.then(whenIdle);
    else whenIdle();

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof cancelIdleCallback === "function") {
        cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, []);

  // No looping under reduced motion: rest on the finale — the content, not the
  // performance of getting to it. Derived, not stored, so the loop's own state
  // stays untouched if the OS setting is flipped back mid-session.
  const shown = reduced ? LAST_LEAF : step;

  useEffect(() => {
    if (reduced || !settled) return;

    // A single timer per state, cleared on every transition. The old version
    // nested timers inside timer callbacks where the cleanup couldn't reach
    // them, so a restarting loop raced the one still unwinding.
    let id: ReturnType<typeof setTimeout>;
    const after = (ms: number, fn: () => void) => {
      id = setTimeout(fn, ms);
    };

    if (!closing) {
      if (step === -1) after(OPEN_DELAY_MS, () => setStep(0));
      else if (step === 0) after(FLYLEAF_DELAY_MS, () => setStep(1));
      else if (step < LAST_LEAF) after(PAGE_DWELL_MS, () => setStep(step + 1));
      else after(FINALE_PAUSE_MS, () => setClosing(true));
    } else {
      if (step > -1) after(CLOSE_STAGGER_MS, () => setStep(step - 1));
      else after(LOOP_DELAY_MS, () => setClosing(false));
    }

    return () => clearTimeout(id);
  }, [step, closing, reduced, settled]);

  return (
    <div className="absolute inset-0">
      <OpenBook step={shown} />
    </div>
  );
}
