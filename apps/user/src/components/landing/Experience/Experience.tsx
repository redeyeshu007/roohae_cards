/**
 * FILE PURPOSE:
 * Interactive video experience showcase section on the landing page.
 *
 * MAIN RESPONSIBILITY:
 * Orchestrates typography word-reveal physics, scroll-based parallax transformations,
 * and hosts the custom VideoPlayer component.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/Experience/VideoPlayer.tsx
 * - apps/user/src/app/page.tsx
 */

"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import { VideoPlayer } from "./VideoPlayer";

const DESCRIPTION =
  "Discover how ideas transform into timeless creations through thoughtful design, elegant craftsmanship, and the Roohae creative experience.";

const words = DESCRIPTION.split(" ");

const wordVariants = {
  hidden: { y: "110%", rotateZ: 4 },
  visible: (i: number) => ({
    y: "0%",
    rotateZ: 0,
    transition: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1] as const, // snappier modern expo easing
      delay: i * 0.035,
    },
  }),
};

export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Fire word animations when text enters the viewport
  const isTextInView = useInView(textRef, { margin: "-15%" });

  // Track scroll for video entrance
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Video parallax — delayed behind the text
  const videoY = useTransform(scrollYProgress, [0.1, 0.55], [80, 0]);
  const videoOpacity = useTransform(scrollYProgress, [0.15, 0.4], [0, 1]);
  const videoScale = useTransform(scrollYProgress, [0.1, 0.5], [0.94, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#1E1E1E] py-6 md:py-8 overflow-hidden"
    >
      {/* Subtle grain overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.025] z-[1] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      {/* Description — word-by-word stagger reveal */}
      <p
        ref={textRef}
        aria-label={DESCRIPTION}
        className="relative z-10 font-sans font-normal text-[#F5C3D2]/80 text-[16px] md:text-[18px] lg:text-[20px] xl:text-[24px] leading-[1.7] w-full px-6 md:px-10 lg:px-4 text-left mb-0 flex flex-wrap gap-x-[0.35em]"
      >
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden py-1">
            <motion.span
              custom={i}
              variants={wordVariants}
              initial="hidden"
              animate={isTextInView ? "visible" : "hidden"}
              className="inline-block origin-bottom-left"
            >
              {word}
            </motion.span>
          </span>
        ))}
      </p>

      {/* Video — scroll-driven fade + rise + scale */}
      <motion.div
        style={{ y: videoY, opacity: videoOpacity, scale: videoScale }}
        className="relative z-10 w-full"
      >
        <VideoPlayer />
      </motion.div>
    </section>
  );
}
