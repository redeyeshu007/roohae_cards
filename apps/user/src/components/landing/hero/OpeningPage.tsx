"use client";

import { useRef, useEffect } from "react";

import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import Book from "./book/Book";

// WebGL can't render on the server, and three shouldn't sit in the initial
// bundle for a page that is otherwise text.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/** Weight of the display type. The off-screen ruler must measure at this same
 *  weight or every width is wrong — 800 is appreciably wider than 400. */
const DISPLAY_WEIGHT = 800;

/** Leading of the display type, and the divisor the height fit uses. Plus
 *  Jakarta Sans caps stand ~0.73em, so at 0.84 the ink sits inside its own line
 *  box and the box is what governs the layout. */
const LEADING = 0.84;

/** Vertical budget outside the two words, in px. */
const HEADER = 88; // login button + top padding
const COPY_BLOCK = 165; // paragraph (~4 lines at its larger size) + mt-10 above it
const BOTTOM = 32; // breathing room under the copy
const META_BAR = 56; // rule + meta row along the bottom edge
const GAP_WORDS = 8; // ROOHAE → CARDS: tight, so they read as one block
const OVERHEAD = HEADER + COPY_BLOCK + BOTTOM + GAP_WORDS + META_BAR;

/** -----------------------------------
 * Masthead
 *
 * Both words share one font size, so the longer word sets the width and the
 * shorter one simply falls short — the flush-left ragged edge of the
 * reference. Measured with an off-screen ruler appended to <body>, so no
 * parent overflow-hidden can clip the measurement. Recalculates on resize.
 * ----------------------------------- */
function Masthead() {
  const containerRef = useRef<HTMLDivElement>(null);
  const roohaeRef = useRef<HTMLSpanElement>(null);
  const cardsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let observer: ResizeObserver | null = null;

    /** Natural width of `text` per 1px of font size. */
    const widthPerFontPx = (text: string) => {
      const ruler = document.createElement("span");
      ruler.style.cssText = [
        "position:fixed",
        "visibility:hidden",
        "pointer-events:none",
        "white-space:nowrap",
        "font-size:300px",
        "line-height:1",
        "font-family:var(--font-primary),sans-serif",
        `font-weight:${DISPLAY_WEIGHT}`,
        "text-transform:uppercase",
        "top:-9999px",
        "left:-9999px",
      ].join(";");
      ruler.textContent = text;
      document.body.appendChild(ruler);
      const width = ruler.getBoundingClientRect().width;
      document.body.removeChild(ruler);
      return width / 300;
    };

    const fit = () => {
      const container = containerRef.current;
      const roohae = roohaeRef.current;
      const cards = cardsRef.current;
      if (!container || !roohae || !cards) return;

      // The longer word governs the width; both are set at the same size.
      const widest = Math.max(widthPerFontPx("ROOHAE"), widthPerFontPx("CARDS"));
      if (widest === 0) return;

      const available = window.innerHeight - OVERHEAD;
      const heightBased = available / (LEADING * 2);
      const widthBased = container.clientWidth / widest;

      const size = Math.floor(Math.min(heightBased, widthBased));
      roohae.style.fontSize = `${size}px`;
      cards.style.fontSize = `${size}px`;
    };

    // Wait for custom fonts before the first measurement
    document.fonts.ready.then(() => {
      fit();
      observer = new ResizeObserver(fit);
      if (containerRef.current) observer.observe(containerRef.current);
    });

    return () => observer?.disconnect();
  }, []);

  const wordClass =
    "font-primary text-primary-text uppercase letterpress inline-block whitespace-nowrap";
  const wordStyle = {
    lineHeight: LEADING,
    fontSize: "300px",
    fontWeight: DISPLAY_WEIGHT,
  } as const;

  return (
    <div ref={containerRef} className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.45 }}
        className="w-full flex justify-start"
      >
        <h1 aria-label="ROOHAE" className="block text-left">
          <span ref={roohaeRef} className={wordClass} style={wordStyle} aria-hidden="true">
            ROOHAE
          </span>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.9 }}
        className="w-full flex justify-start"
        style={{ marginTop: GAP_WORDS }}
      >
        <h2 aria-label="Cards" className="block text-left">
          <span ref={cardsRef} className={wordClass} style={wordStyle} aria-hidden="true">
            CARDS
          </span>
        </h2>
      </motion.div>
    </div>
  );
}

/** -----------------------------------
 * Animation helpers
 * ----------------------------------- */
const fade = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.7, ease: "easeOut" as const, delay },
});

/** -----------------------------------
 * Opening Page
 * ----------------------------------- */
export function OpeningPage() {
  const { scrollY } = useScroll();

  // Scroll animations mapping
  const sceneOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const mastheadY = useTransform(scrollY, [0, 500], [0, -150]);
  const mastheadOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const copyOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const copyY = useTransform(scrollY, [0, 300], [0, -50]);

  return (
    <div className="relative h-[100svh] w-full flex flex-col items-center overflow-hidden bg-background">

      {/* WebGL — z-0, under the grain and the type */}
      <motion.div style={{ opacity: sceneOpacity }} className="absolute inset-0 z-0 pointer-events-none">
        <HeroScene />
      </motion.div>

      {/* Paper grain — almost invisible */}
      <div aria-hidden="true" className="absolute inset-0 paper-texture pointer-events-none z-10" />

      {/* ── Header ── */}
      {/* Three columns so the logo centres on the page, not on the space left
          over by the login button. */}
      <header className="relative w-full flex items-center justify-center px-5 pt-5 md:px-10 md:pt-2 z-20 shrink-0">
        {/* Logo */}
        <motion.div {...fade(0)}>
          <Image
            src="/logo.png"
            alt="Roohae Cards"
            width={969}
            height={377}
            loading="eager"
            className="h-[36px] md:h-[40px] w-auto"
          />
        </motion.div>
      </header>

      {/* ── Hero Typography ── */}
      {/* Left column: the masthead and its copy sit flush left, leaving the
          right third open. */}
      <main
        role="main"
        className="relative flex-1 flex flex-col items-start justify-center w-full px-5 md:px-10 z-20"
      >
        <div className="relative w-full">
          {/* Innovation & imagination heading - Top Right */}
          <div className="hidden md:block absolute right-2 lg:right-4 top-6 lg:top-10 pointer-events-none z-30">
            <h3 className="font-primary font-medium text-black text-3xl lg:text-4xl leading-tight text-left tracking-tight">
              Innovation &<br />imagination
            </h3>
          </div>

          <div className="w-full md:max-w-[70%]">
            <motion.div style={{ y: mastheadY, opacity: mastheadOpacity }}>
              <Masthead />
            </motion.div>

            {/* Copy */}
            <motion.div style={{ y: copyY, opacity: copyOpacity }}>
              <motion.div {...fade(1.05)} className="mt-10 max-w-[560px] text-left">
                <p className="font-secondary font-light text-primary-text text-[clamp(1rem,1.5vw,1.5rem)] leading-[1.45] tracking-[0.01em]">
                  At Roohae, we believe the most meaningful moments deserve
                  thoughtful design. Our platform empowers creators to craft
                  elegant, print-worthy cards with timeless simplicity.
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* The notebook — owns the right column. Absolute and
              pointer-events-none, so it touches neither the layout nor the
              Masthead's height budget. */}
          <div className="hidden md:flex absolute right-0 top-0 bottom-0 w-[40%] pointer-events-none items-center justify-center translate-y-[160px]">
            <Book />
          </div>
        </div>
      </main>

      {/* ── Meta rule ── */}
      {/* Every string here is drawn from the app's own metadata — nothing about
          founding year, location or social handles, which aren't on record. */}
      <motion.footer
        {...fade(1.35)}
        className="relative w-full z-20 shrink-0 px-5 md:px-10 pb-5 md:pb-6"
      >
        <div className="w-full border-t border-primary-text/20 pt-1 flex items-center justify-between gap-1">
          <span className="font-secondary text-primary-text/70 text-[10px] md:text-[11px] uppercase tracking-[0.28em] whitespace-nowrap">
            Premium Design Platform
          </span>
          <span className="hidden md:block font-secondary text-primary-text/70 text-[10px] md:text-[11px] uppercase tracking-[0.28em] whitespace-nowrap">
            Cards · Invitations · Print-Ready
          </span>
          <span className="font-secondary text-primary-text/70 text-[10px] md:text-[11px] uppercase tracking-[0.28em] whitespace-nowrap">
            © 2026
          </span>
        </div>
      </motion.footer>

    </div>
  );
}
