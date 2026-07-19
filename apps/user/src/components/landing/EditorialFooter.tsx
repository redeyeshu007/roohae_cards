"use client";

import React from "react";
import { motion } from "framer-motion";

export const EditorialFooter = () => {
  return (
    <footer
      className="relative w-full overflow-hidden flex flex-col items-center"
      style={{
        backgroundColor: "#1B1B1B",
      }}
    >
      {/* Subtle Grain Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 mix-blend-overlay"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        className="w-full flex flex-col items-center relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Bottom Section */}
        <div className="w-full max-w-7xl mx-auto px-6 py-2 flex justify-center text-center">
          <p
            className="font-sans uppercase tracking-[0.1em]"
            style={{
              color: "rgba(242,198,216,0.65)",
              fontSize: "13px",
              fontWeight: 400,
            }}
          >
            Crafted with Purpose • &copy; 2026 Roohae
          </p>
        </div>
      </motion.div>
    </footer>
  );
};
