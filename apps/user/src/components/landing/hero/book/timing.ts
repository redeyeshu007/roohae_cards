/**
 * FILE PURPOSE:
 * Timing constants and duration configuration for the hero book animation sequence.
 *
 * MAIN RESPONSIBILITY:
 * Synchronizes cover turn physics, page turn delays, reading dwells, and closing riffle pacing.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/hero/book/Book.tsx
 * - apps/user/src/components/landing/hero/book/PageTurn.tsx
 */

/** -----------------------------------
 * Book timing
 *
 * Shared between the state machine (Book) and the leaves (PageTurn) so a dwell
 * can never be shorter than the turn it is waiting on.
 * ----------------------------------- */

/** The cover is heavy — it moves slower than paper, both ways. */
export const COVER_TURN_MS = 1700;

/** A leaf turning open, at reading pace. */
export const PAGE_TURN_MS = 1150;

/** Turning back, on the way to closed. Quicker than opening — this is a riffle,
 *  not a read — but not so quick that the sheets snap. */
export const PAGE_CLOSE_MS = 720;

/** Beat before the cover lifts, timed from the moment the page goes quiet — not
 *  from mount. The wait for a settled thread already supplies the pause, so
 *  this only has to be long enough to read as a breath. */
export const OPEN_DELAY_MS = 600;

/** Cover open -> the blank flyleaf follows it over. Nothing to read, so this is
 *  just enough of a gap that the two turns don't merge into one gesture. */
export const FLYLEAF_DELAY_MS = COVER_TURN_MS + 250;

/** Turn to turn. The turn itself eats PAGE_TURN_MS of this, so the page is
 *  actually still and readable for the remainder. */
export const PAGE_DWELL_MS = 3200;

/** Rest on the finale before closing. */
export const FINALE_PAUSE_MS = 3600;

/** Leaf to leaf while closing. Shorter than PAGE_CLOSE_MS on purpose — the
 *  turns overlap, and that overlap is the riffle. Each sheet is still ~half way
 *  over when the next lifts, so the fan stays continuous instead of stepping. */
export const CLOSE_STAGGER_MS = 360;

/** Closed, before it all begins again. */
export const LOOP_DELAY_MS = 2600;
