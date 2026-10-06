/**
 * FILE PURPOSE:
 * Landing page editorial interactive accordion/brand philosophy section.
 *
 * MAIN RESPONSIBILITY:
 * Renders four core brand pillars (IDEAS, DESIGN, CUSTOMIZE, PRINT) with smooth hover state animations,
 * descriptions, and lazy-loaded WebGL canvas backdrop.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/Editorial/EditorialCanvas.tsx
 * - apps/user/src/app/page.tsx
 */

"use client";

import { useRef, useState, useEffect, lazy, Suspense } from "react";

const EditorialCanvas = lazy(() => import("./EditorialCanvas"));

const ROWS = [
  {
    word: "IDEAS",
    description:
      "Every remarkable creation begins with a single idea. Capture inspiration and transform imagination into something extraordinary.",
  },
  {
    word: "DESIGN",
    description:
      "Shape your vision with intuitive tools, beautiful templates, and complete creative freedom in every detail.",
  },
  {
    word: "CUSTOMIZE",
    description:
      "Refine every element with precision. Personalize colors, typography, layouts, and assets to create something uniquely yours.",
  },
  {
    word: "PRINT",
    description:
      "Export production-ready designs with exceptional quality, crafted for both digital experiences and professional printing.",
  },
];

/* ─── Colours ─────────────────────────────────────────────────────────── */
const BG_PRIMARY    = "#E0ADBE";             // dominant blush pink
const DIVIDER       = "rgba(17,17,17,0.12)";
const TEXT_DEFAULT  = "#111111";             // resting heading colour
const TEXT_HOVER    = "#E0ADBE";             // blush pink — heading on hover (matches reference)
const ROW_BG_HOVER  = "#1C1C1E";             // near-black row background on hover
const DIVIDER_HOVER = "rgba(224,173,190,0.2)"; // blush-tinted divider on hovered row
const GOLD          = "#C9A96E";             // underline accent
const DESC_COLOR    = "#D4ABBE";             // soft blush pink for description text on hover

export function EditorialSection() {
  const containerRef                      = useRef<HTMLDivElement>(null);
  const [scrollIndex, setScrollIndex]     = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex]   = useState<number | null>(null);

  /* Scroll fallback (touch / keyboard navigation) */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const scrollY      = window.scrollY;
      const containerTop = container.getBoundingClientRect().top + window.scrollY;
      const containerH   = container.offsetHeight;
      const rowH         = containerH / ROWS.length;
      const progress     = scrollY - containerTop;

      if (progress < 0 || progress > containerH) {
        setScrollIndex(null);
        return;
      }
      setScrollIndex(Math.min(Math.floor(progress / rowH), ROWS.length - 1));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Hover wins over scroll when a row is hovered */
  const activeIndex = hoveredIndex !== null ? hoveredIndex : scrollIndex;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden flex flex-col"
      style={{ height: "100svh", backgroundColor: BG_PRIMARY }}
    >
      {/* Three.js silk-paper background */}
      <Suspense fallback={null}>
        <EditorialCanvas />
      </Suspense>

      {/* Top divider */}
      <div
        className="w-full flex-none relative z-10"
        style={{ borderTop: `1px solid ${DIVIDER}` }}
      />

      {/* ── Rows ── */}
      {ROWS.map((row, index) => {
        const isHovered = hoveredIndex === index;
        // Since we removed scroll tracking, isActive only relies on hover
        const isActive = isHovered;
        
        return (
          <div
            key={row.word}
            className="w-full flex-1 flex items-center overflow-hidden relative z-10 cursor-default"
            style={{
              borderBottom: `1px solid ${isHovered ? DIVIDER_HOVER : DIVIDER}`,
              /* Full dark flip on hover */
              backgroundColor: isHovered ? ROW_BG_HOVER : "transparent",
              transition:
                "background-color 500ms ease-in-out, border-color 500ms ease-in-out",
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* ── Heading (left) ──────────────────────────────────── */}
            <div
              className="relative flex-shrink-0 pl-5 md:pl-10 select-none"
              style={{
                transform: isActive ? "scale(1.03)" : "scale(1)",
                transformOrigin: "left center",
                transition: "transform 800ms ease-in-out",
              }}
            >
              <h2
                className="font-primary uppercase tracking-tight m-0"
                style={{
                  fontSize: "clamp(3.5rem, 18vh, 14rem)",
                  lineHeight: "1.05",
                  fontWeight: 300,
                  /* colour shifts on hover */
                  color: isHovered ? TEXT_HOVER : TEXT_DEFAULT,
                  transition: "color 500ms ease-in-out",
                }}
              >
                {row.word}
              </h2>

              {/* Gold underline — grows on hover */}
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  height: "2px",
                  borderRadius: "1px",
                  backgroundColor: GOLD,
                  width: isActive ? "100%" : "0%",
                  transition: "width 600ms ease-in-out",
                  marginTop: "0.3rem",
                }}
              />
            </div>

            {/* ── Description (right) — ONLY visible on hover ─────── */}
            <div
              className="absolute right-6 md:right-3 max-w-[320px] md:max-w-[420px]"
              style={{
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? "translateY(0px)" : "translateY(20px)",
                transition:
                  "opacity 500ms ease-in-out, transform 500ms ease-in-out",
                pointerEvents: isHovered ? "auto" : "none",
              }}
            >
              <p
                className="font-secondary font-light leading-[1.6]"
                style={{
                  fontSize: "clamp(0.95rem, 1.4vw, 1.25rem)",
                  color: DESC_COLOR,
                }}
              >
                {row.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
