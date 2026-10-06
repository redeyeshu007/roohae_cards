/**
 * FILE PURPOSE:
 * Typography rendering sheet component for book page spreads (verso left and recto right).
 *
 * MAIN RESPONSIBILITY:
 * Typesets atelier dates, title display font, subtitles, hand-written notes, and signatures
 * sized in container query units (cqi) across the facing pages of the opened book.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/hero/book/Page.tsx
 * - apps/user/src/components/landing/hero/book/pages.ts
 */

"use client";

import Image from "next/image";
import { type PageData } from "./pages";

/** -----------------------------------
 * Writing
 *
 * One composition, laid across both pages of the spread:
 *
 *   verso (left)   the atelier tag and the display title — the statement
 *   recto (right)  subtitle, note and signature — the supporting matter
 *
 * Split rather than centred across the whole spread, because a book has a
 * gutter: type running over the spine gets bent into it and cut by its shadow.
 * Facing pages, each composed to its own sheet, is how a real spread reads.
 *
 * Every size is in `cqi` — a share of the page's own width — and the root is
 * the container they resolve against. The book is sized off viewport *height*
 * (h-[60%], fixed aspect), so type in `vw` scales on an axis the sheet doesn't:
 * at 16:9 the composition outgrew the page and the signature fell off the
 * bottom edge. Measured against the page, it holds at any size.
 *
 * overflow-hidden because a page has to clip to itself. Without it an overrun
 * escapes the book entirely — visible even through a shut cover, since every
 * leaf is stacked on the right half.
 * ----------------------------------- */

const HAIRLINE = "0.5px";

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden flex items-center justify-center px-[6%] py-[7%]"
      style={{ containerType: "inline-size" }}
    >
      <div className="w-full flex flex-col items-center">{children}</div>
    </div>
  );
}

export function Writing({ page, side }: { page: PageData; side: "verso" | "recto" }) {
  if (page.isBlank) return null;

  if (side === "verso") {
    return (
      <Sheet>
        {/* ── Date / atelier tag ── */}
        <span
          style={{
            fontFamily: "var(--font-secondary)",
            color: page.accentColor,
            fontSize: "5.5cqi",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: "4cqi",
          }}
        >
          {page.date}
        </span>

        {/* ── Thin rule under the tag ── */}
        <div
          style={{
            width: "38%",
            height: HAIRLINE,
            background: `linear-gradient(90deg, transparent, ${page.accentColor}, transparent)`,
            marginBottom: "9cqi",
          }}
        />

        {/* ── The display title, given a page of its own. On the finale the
             brand mark takes its place: unfiltered, because the logo's own
             dark ink already reads against cream stock. ── */}
        {page.logo ? (
          <Image
            src="/logo.png"
            alt=""
            width={969}
            height={377}
            style={{ width: "76cqi", height: "auto" }}
          />
        ) : (
          <div className="flex flex-col items-center">
            {page.title.map((line, i) => (
              <span
                key={i}
                style={{
                  fontFamily: page.hand,
                  color: page.inkColor,
                  fontSize: page.titleSize,
                  lineHeight: page.leading,
                  textAlign: "center",
                  display: "block",
                }}
              >
                {line}
              </span>
            ))}
          </div>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet>
      {/* ── Subtitle ── */}
      <span
        style={{
          fontFamily: "var(--font-secondary)",
          color: page.inkColor,
          fontSize: "7.5cqi",
          lineHeight: 1.5,
          letterSpacing: "0.04em",
          opacity: 0.85,
          fontWeight: 400,
          textAlign: "center",
          marginBottom: "10cqi",
        }}
      >
        {page.subtitle}
      </span>

      {/* ── Decorative divider ── */}
      <div className="flex items-center" style={{ gap: "3.5cqi", marginBottom: "10cqi" }}>
        <div
          style={{
            width: "16cqi",
            height: HAIRLINE,
            background: page.accentColor,
            opacity: 0.75,
          }}
        />
        <div
          style={{
            width: "2cqi",
            height: "2cqi",
            borderRadius: "50%",
            background: page.accentColor,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            width: "16cqi",
            height: HAIRLINE,
            background: page.accentColor,
            opacity: 0.75,
          }}
        />
      </div>

      {/* ── Small handwritten note ── */}
      <span
        style={{
          fontFamily: page.hand,
          color: page.inkColor,
          fontSize: "6.2cqi",
          opacity: 0.8,
          fontStyle: "italic",
          textAlign: "center",
          marginBottom: "10cqi",
        }}
      >
        {page.note}
      </span>

      {/* ── Bottom thin rule ── */}
      <div
        style={{
          width: "28%",
          height: HAIRLINE,
          background: `linear-gradient(90deg, transparent, ${page.accentColor}, transparent)`,
          marginBottom: "6cqi",
        }}
      />

      {/* ── Signature ── */}
      <span
        style={{
          fontFamily: page.hand,
          color: page.accentColor,
          fontSize: "10cqi",
          opacity: 0.95,
          textAlign: "center",
        }}
      >
        {page.signature}
      </span>
    </Sheet>
  );
}
