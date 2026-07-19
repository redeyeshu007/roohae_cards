"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface ProductRevealProps {
  visible: boolean;
  label: string;
  secondLabel?: string;
  accentColor?: string;
}

// Tiny sparkle star path
function Sparkle({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
      transition={{ duration: 1.5, delay, ease: "easeInOut" }}
    >
      <path
        d={`M${x} ${y - size} L${x + size * 0.3} ${y - size * 0.3} L${x + size} ${y} L${x + size * 0.3} ${y + size * 0.3} L${x} ${y + size} L${x - size * 0.3} ${y + size * 0.3} L${x - size} ${y} L${x - size * 0.3} ${y - size * 0.3} Z`}
        fill="#D98CA6"
        opacity="0.85"
      />
    </motion.g>
  );
}

const PRODUCT_DESIGNS: Record<string, { lines: string[]; color: string; pattern: "wedding" | "business" | "birthday" | "event" | "certificate" }> = {
  "Luxury Wedding Invitation": {
    lines: ["SARAH & JAMES", "Together Forever", "July 28, 2026"],
    color: "#C8879E",
    pattern: "wedding",
  },
  "Luxury Business Card": {
    lines: ["ALEX MORGAN", "Creative Director", "alex@studio.com"],
    color: "#8A7BA0",
    pattern: "business",
  },
  "Birthday Invitation": {
    lines: ["It's a Party!", "Emma turns 30", "Saturday, Aug 10"],
    color: "#E0956A",
    pattern: "birthday",
  },
  "Event Pass": {
    lines: ["SUMMIT 2026", "VIP Access", "Hall A · Seat 12"],
    color: "#5A8FA0",
    pattern: "event",
  },
  "Event Invitation": {
    lines: ["GALA EVENING", "Corporate Summit", "Dec 15 · 7 PM"],
    color: "#7A8FA0",
    pattern: "event",
  },
  "Premium Certificate": {
    lines: ["Certificate of", "Excellence", "Awarded with Honor"],
    color: "#C9A96E",
    pattern: "certificate",
  },
};

export function ProductReveal({ visible, label, accentColor = "#D98CA6" }: ProductRevealProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(t);
    } else {
      setShowContent(false);
    }
  }, [visible]);

  const design = PRODUCT_DESIGNS[label] || PRODUCT_DESIGNS["Luxury Wedding Invitation"];
  const cardColor = design?.color || accentColor;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="product-reveal"
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
          {/* Particle bloom */}
          <motion.div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${4 + Math.random() * 5}px`,
                  height: `${4 + Math.random() * 5}px`,
                  background: cardColor,
                  opacity: 0,
                }}
                animate={{
                  opacity: [0, 0.7, 0],
                  x: [0, (Math.cos((i / 14) * Math.PI * 2) * 120)],
                  y: [0, (Math.sin((i / 14) * Math.PI * 2) * 80)],
                  scale: [0, 1.5, 0],
                }}
                transition={{ duration: 1, delay: i * 0.04, ease: "easeOut" }}
              />
            ))}
          </motion.div>

          {/* The card / product */}
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ scale: 0.4, rotateY: -90, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            exit={{ scale: 0.8, rotateY: 30, opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: "800px" }}
          >
            {/* Rotating wrapper */}
            <motion.div
              animate={{ rotateY: [0, 4, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              style={{ perspective: "600px" }}
            >
              {/* Paper shadow */}
              <motion.div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                style={{ width: "90%", height: "12px", background: "rgba(0,0,0,0.08)", borderRadius: "50%", filter: "blur(6px)" }}
                animate={{ scaleX: [1, 0.95, 1.02, 1], opacity: [0.6, 0.4, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Card surface */}
              <div
                className="relative overflow-hidden"
                style={{
                  width: "clamp(180px, 26vw, 300px)",
                  height: "clamp(120px, 18vw, 200px)",
                  background: "#FFFDF9",
                  borderRadius: "8px",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                {/* Top accent bar */}
                <div style={{ height: "4px", background: `linear-gradient(90deg, ${cardColor}, ${cardColor}88)` }} />

                {/* Decorative corner ornament */}
                <svg className="absolute top-2 right-2" width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 2 Q20 8 26 14 Q20 20 14 26 Q8 20 2 14 Q8 8 14 2 Z" stroke={cardColor} strokeWidth="0.8" fill="none" opacity="0.4" />
                  <circle cx="14" cy="14" r="2.5" fill={cardColor} opacity="0.5" />
                </svg>
                <svg className="absolute bottom-2 left-2" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 1 Q15 6 19 10 Q15 14 10 19 Q5 14 1 10 Q5 6 10 1 Z" stroke={cardColor} strokeWidth="0.7" fill="none" opacity="0.3" />
                </svg>

                {/* Content */}
                <AnimatePresence>
                  {showContent && (
                    <motion.div
                      className="absolute inset-x-0 top-6 flex flex-col items-center justify-center gap-1 px-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      {design.pattern === "certificate" && (
                        <svg className="mb-1" width="40" height="10" viewBox="0 0 40 10">
                          <path d="M0 5 Q20 0 40 5" stroke={cardColor} strokeWidth="0.8" fill="none" opacity="0.5" />
                        </svg>
                      )}

                      <div
                        className="font-primary text-center leading-tight"
                        style={{
                          fontSize: "clamp(0.55rem, 1.2vw, 0.9rem)",
                          fontWeight: 800,
                          color: "#1F1F1F",
                          letterSpacing: design.pattern === "certificate" ? "0.12em" : "0.04em",
                        }}
                      >
                        {design.lines[0]}
                      </div>

                      {/* Divider */}
                      <div style={{ width: "40px", height: "1px", background: `${cardColor}88`, margin: "2px 0" }} />

                      <div
                        className="font-sans text-center"
                        style={{
                          fontSize: "clamp(0.45rem, 0.9vw, 0.7rem)",
                          color: "#4A3A34",
                          fontWeight: 400,
                          opacity: 0.8,
                          fontStyle: design.pattern === "wedding" ? "italic" : "normal",
                        }}
                      >
                        {design.lines[1]}
                      </div>

                      <div
                        className="font-sans text-center"
                        style={{
                          fontSize: "clamp(0.4rem, 0.75vw, 0.6rem)",
                          color: cardColor,
                          fontWeight: 500,
                          letterSpacing: "0.08em",
                          marginTop: "2px",
                        }}
                      >
                        {design.lines[2]}
                      </div>

                      {/* Bottom line ornament */}
                      <svg className="mt-2" width="60" height="6" viewBox="0 0 60 6">
                        <path d="M0 3 Q15 0 30 3 Q45 6 60 3" stroke={cardColor} strokeWidth="0.8" fill="none" opacity="0.5" />
                        <circle cx="30" cy="3" r="1.5" fill={cardColor} opacity="0.6" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Subtle paper texture overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E")`,
                    backgroundSize: "128px 128px",
                    mixBlendMode: "multiply",
                  }}
                />
              </div>
            </motion.div>

            {/* Label below */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-5 font-sans font-medium tracking-widest uppercase text-center"
              style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.7rem)", color: cardColor, letterSpacing: "0.22em" }}
            >
              {label}
            </motion.div>

            {/* Sparkles */}
            <svg className="absolute -top-1 -left-1 w-8 h-8" viewBox="0 0 120 120" overflow="visible">
              <Sparkle x={15} y={20} size={5} delay={0.6} />
              <Sparkle x={105} y={15} size={4} delay={0.9} />
              <Sparkle x={100} y={95} size={6} delay={1.1} />
              <Sparkle x={10} y={100} size={4} delay={0.7} />
              <Sparkle x={60} y={5} size={3.5} delay={1.3} />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
