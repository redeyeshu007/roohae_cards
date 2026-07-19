"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomerCharacter } from "./CustomerCharacter";
import { RoohaeCharacter } from "./RoohaeCharacter";
import { ProductReveal } from "./ProductReveal";

/* ──────────────────────────────────────────────────────────────────────────
   CONVERSATION DATA
────────────────────────────────────────────────────────────────────────── */

interface Conversation {
  customerLine: string;
  roohaeLine: string;
  products: string[];
}

const CONVERSATIONS: Conversation[] = [
  {
    customerLine: "We're getting married next month.",
    roohaeLine: "Congratulations! 💖\nLet's create an invitation your guests will never forget.",
    products: ["Luxury Wedding Invitation"],
  },
  {
    customerLine: "Our company needs professional visiting cards.",
    roohaeLine: "Absolutely.\nLet's create a premium first impression.",
    products: ["Luxury Business Card"],
  },
  {
    customerLine: "We're planning a birthday celebration.",
    roohaeLine: "That sounds exciting! 🎉\nLet's make it colorful and memorable.",
    products: ["Birthday Invitation"],
  },
  {
    customerLine: "We're organizing a corporate event.",
    roohaeLine: "Perfect.\nI'll design professional event passes and invitations.",
    products: ["Event Pass", "Event Invitation"],
  },
  {
    customerLine: "We need certificates for our students.",
    roohaeLine: "Every achievement deserves recognition.\nLet's create certificates they'll proudly keep forever.",
    products: ["Premium Certificate"],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────────────────────────────────────── */

const TYPING_SPEED = 32; // ms per character
const ROOHAE_DELAY = 1200; // ms after customer finishes before Roohae starts
const PRODUCT_SHOW_DELAY = 600; // ms after Roohae finishes
const PRODUCT_HOLD_MS = 3200; // ms product stays visible
const FADE_OUT_MS = 900; // ms to fade before next convo

/* ──────────────────────────────────────────────────────────────────────────
   TYPING BUBBLE
────────────────────────────────────────────────────────────────────────── */

type BubbleSide = "left" | "right";

interface SpeechBubbleProps {
  text: string;
  side: BubbleSide;
  visible: boolean;
}

function SpeechBubble({ text, side, visible }: SpeechBubbleProps) {
  const [displayed, setDisplayed] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setDisplayed("");
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    let i = 0;
    setDisplayed("");
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, TYPING_SPEED);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, visible]);

  const isLeft = side === "left";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`bubble-${side}-${text.slice(0, 10)}`}
          initial={{ opacity: 0, scale: 0.88, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -8, transition: { duration: 0.5 } }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute ${isLeft ? "left-[5%] top-[12%]" : "right-[5%] top-[12%]"}`}
          style={{ maxWidth: "clamp(180px, 28vw, 340px)" }}
        >
          {/* Bubble */}
          <div
            style={{
              background: isLeft ? "rgba(50,35,40,0.92)" : "rgba(60,30,45,0.94)",
              borderRadius: isLeft ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.38), 0 1px 6px rgba(0,0,0,0.2)",
              padding: "clamp(10px, 1.4vw, 18px) clamp(14px, 1.8vw, 24px)",
              border: isLeft ? "1px solid rgba(217,140,166,0.18)" : "1px solid rgba(217,140,166,0.28)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Typing dots when empty */}
            {displayed.length === 0 ? (
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map((dot) => (
                  <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isLeft ? "#C8879E" : "#F0A0C0" }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </div>
            ) : (
              <p
                className="font-sans leading-relaxed whitespace-pre-line"
                style={{
                  fontSize: "clamp(0.72rem, 1.1vw, 0.95rem)",
                  color: isLeft ? "#F5C3D2" : "#FFD6E8",
                  fontWeight: 400,
                  lineHeight: 1.65,
                }}
              >
                {displayed}
                {/* cursor */}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  style={{ display: "inline-block", width: "2px", height: "0.85em", background: isLeft ? "#C8879E" : "#F0A0C0", marginLeft: "2px", verticalAlign: "middle", borderRadius: "1px" }}
                />
              </p>
            )}
          </div>

          {/* Tail */}
          <div
            style={{
              position: "absolute",
              bottom: "-6px",
              ...(isLeft ? { left: "16px" } : { right: "16px" }),
              width: "14px",
              height: "12px",
              background: isLeft ? "rgba(50,35,40,0.92)" : "rgba(60,30,45,0.94)",
              clipPath: isLeft
                ? "polygon(0 0, 100% 0, 0 100%)"
                : "polygon(0 0, 100% 0, 100% 100%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MAIN SECTION
────────────────────────────────────────────────────────────────────────── */

type Phase =
  | "customer-typing"
  | "roohae-typing"
  | "product-show"
  | "fading";

export function ConversationStory() {
  const [convIndex, setConvIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("customer-typing");
  const [productIndex, setProductIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conv = CONVERSATIONS[convIndex];
  const currentProduct = conv.products[productIndex];

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const scheduleNext = useCallback((fn: () => void, delay: number) => {
    clearTimer();
    timerRef.current = setTimeout(fn, delay);
  }, []);

  // Customer finishes → trigger Roohae
  const customerTypeDuration = conv.customerLine.length * TYPING_SPEED + 300;
  // Roohae finishes → show product
  const roohaeTypeDuration = conv.roohaeLine.length * TYPING_SPEED + 300;

  useEffect(() => {
    clearTimer();

    if (phase === "customer-typing") {
      scheduleNext(() => setPhase("roohae-typing"), customerTypeDuration + ROOHAE_DELAY);
    } else if (phase === "roohae-typing") {
      scheduleNext(() => setPhase("product-show"), roohaeTypeDuration + PRODUCT_SHOW_DELAY);
    } else if (phase === "product-show") {
      // If multi-product convo, step through products
      if (productIndex < conv.products.length - 1) {
        scheduleNext(() => {
          setProductIndex((p) => p + 1);
        }, PRODUCT_HOLD_MS);
      } else {
        scheduleNext(() => setPhase("fading"), PRODUCT_HOLD_MS);
      }
    } else if (phase === "fading") {
      scheduleNext(() => {
        setConvIndex((i) => (i + 1) % CONVERSATIONS.length);
        setProductIndex(0);
        setPhase("customer-typing");
      }, FADE_OUT_MS);
    }

    return clearTimer;
  }, [phase, convIndex, productIndex, conv.products.length, customerTypeDuration, roohaeTypeDuration, scheduleNext]);

  const showCustomerBubble = phase === "customer-typing" || phase === "roohae-typing";
  const showRoohaeBubble = phase === "roohae-typing";
  const showProduct = phase === "product-show";
  const isFading = phase === "fading";

  const sectionKey = `${convIndex}`;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "100svh",
        background: "#1E1E1E",
      }}
      aria-label="Conversation to creation storytelling"
    >
      {/* Grain overlay — matches Experience section */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0 mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
          opacity: 0.025,
        }}
      />

      {/* Dark pink gradient blobs — subtle glow on dark bg */}
      <div aria-hidden className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-5%",
            width: "55%",
            height: "60%",
            background: "radial-gradient(ellipse at center, rgba(217,140,166,0.07) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            right: "-5%",
            width: "50%",
            height: "55%",
            background: "radial-gradient(ellipse at center, rgba(217,140,166,0.05) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* ── HEADING ─────────────────────────────────────────────────── */}
      <div className="relative z-10 text-center px-1 pt-4 pb-0">
        <h2
          className="font-primary leading-tight"
          style={{
            fontSize: "clamp(1.6rem, 4.5vw, 3.5rem)",
            fontWeight: 800,
            color: "#F5F0EE",
            letterSpacing: "-0.02em",
          }}
        >
          Every Great Design Starts With A{" "}
          <span style={{ color: "#D98CA6" }}>Conversation.</span>
        </h2>
        <p
          className="font-sans font-light mt-1 mx-auto"
          style={{
            fontSize: "clamp(0.82rem, 1.4vw, 1.1rem)",
            color: "#F5C3D2",
            opacity: 0.8,
            maxWidth: "600px",
            lineHeight: 1.75,
          }}
        >
          From life&apos;s biggest celebrations to your growing business,<br className="hidden md:block" />
          Roohae transforms every conversation into beautifully crafted designs.
        </p>
      </div>

      {/* ── STORY STAGE ─────────────────────────────────────────────── */}
      <motion.div
        key={sectionKey}
        className="relative z-10 w-full flex items-end justify-between px-1 md:px-2"
        style={{ height: "clamp(360px, 55vh, 600px)", maxWidth: "1100px", margin: "0 auto" }}
        animate={{ opacity: isFading ? 0 : 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Left — Customer */}
        <div className="relative flex-1 h-full flex flex-col items-end justify-end pb-1 pr-2">
          {/* Customer speech bubble */}
          <SpeechBubble
            text={conv.customerLine}
            side="left"
            visible={showCustomerBubble}
          />
          <CustomerCharacter isSpeaking={phase === "customer-typing"} />
        </div>

        {/* Center — Divider + product reveal */}
        <div className="relative flex-shrink-0 self-stretch flex flex-col items-center justify-center"
          style={{ width: "clamp(160px, 28vw, 340px)" }}
        >
          {/* Vertical divider */}
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2"
            style={{ width: "1px", background: "linear-gradient(to bottom, transparent, rgba(217,140,166,0.25) 30%, rgba(217,140,166,0.25) 70%, transparent)" }}
          />

          {/* Product reveal */}
          <ProductReveal
            visible={showProduct}
            label={currentProduct}
          />
        </div>

        {/* Right — Roohae */}
        <div className="relative flex-1 h-full flex flex-col items-start justify-end pb-1 pl-2">
          {/* Roohae speech bubble */}
          <SpeechBubble
            text={conv.roohaeLine}
            side="right"
            visible={showRoohaeBubble}
          />
          <RoohaeCharacter isSpeaking={phase === "roohae-typing"} />
        </div>
      </motion.div>

      {/* ── CONVERSATION PROGRESS DOTS ───────────────────────────── */}
      <div className="relative z-10 flex justify-center gap-2 mt-2 mb-2">
        {CONVERSATIONS.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{ background: "#D98CA6" }}
            animate={{
              width: i === convIndex ? "24px" : "6px",
              height: "6px",
              opacity: i === convIndex ? 1 : 0.22,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex justify-center pb-20 pt-1">
        <motion.a
          href="/editor"
          className="group relative inline-flex items-center gap-3 font-sans font-semibold"
          style={{
            padding: "clamp(14px, 1.4vw, 18px) clamp(28px, 3.5vw, 48px)",
            borderRadius: "9999px",
            background: "rgba(255,253,249,0.08)",
            color: "#F5C3D2",
            fontSize: "clamp(0.85rem, 1.2vw, 1rem)",
            letterSpacing: "0.02em",
            textDecoration: "none",
            border: "1px solid rgba(217,140,166,0.35)",
            boxShadow: "0 4px 32px rgba(217,140,166,0.12)",
            overflow: "hidden",
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2 }}
        >
          {/* Hover fill animation */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "#D98CA6", borderRadius: "inherit" }}
            initial={{ x: "-100%" }}
            whileHover={{ x: "0%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="relative z-10">Start Designing</span>
          <motion.span
            className="relative z-10 inline-block"
            initial={{ x: 0 }}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
            aria-hidden
          >
            →
          </motion.span>
        </motion.a>
      </div>
    </section>
  );
}
