"use client";

import { TransitionLink } from "@/components/common/TransitionLink";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export function FloatingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 60);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
      className="fixed top-5 right-5 md:top-7 md:right-2 z-[100]"
    >
      <TransitionLink
        href="/login"
        className={`inline-flex items-center justify-center h-[48px] px-7 rounded-full border-[1.5px] transition-all duration-300 ease-out text-[12px] font-secondary tracking-widest uppercase ${
          scrolled
            ? "border-black/80 text-black bg-white/90 backdrop-blur-md hover:bg-black hover:text-white shadow-sm"
            : "border-primary-text text-primary-text bg-transparent hover:bg-primary-text hover:text-background"
        }`}
      >
        Login
      </TransitionLink>
    </motion.div>
  );
}
