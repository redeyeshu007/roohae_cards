"use client";

import { motion } from "framer-motion";

interface CustomerCharacterProps {
  isSpeaking: boolean;
}

export function CustomerCharacter({ isSpeaking }: CustomerCharacterProps) {
  return (
    <div className="relative flex flex-col items-end justify-end h-full w-full select-none">
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex flex-col items-center"
        style={{ width: "clamp(120px, 15vw, 220px)" }}
      >
        <svg
          viewBox="0 0 220 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          aria-hidden="true"
        >
          {/* Shadow */}
          <ellipse cx="110" cy="338" rx="52" ry="6" fill="#C4A89A" opacity="0.25" />

          {/* Body / dress */}
          <motion.path
            d="M68 220 Q60 310 58 335 L162 335 Q160 310 152 220 Z"
            fill="#D4A5B5"
            animate={
              isSpeaking
                ? { d: ["M68 220 Q60 310 58 335 L162 335 Q160 310 152 220 Z",
                        "M68 218 Q62 308 60 333 L160 333 Q158 308 150 218 Z",
                        "M68 220 Q60 310 58 335 L162 335 Q160 310 152 220 Z"] }
                : {}
            }
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Dress accent */}
          <path d="M82 222 Q110 235 138 222 L152 285 Q110 295 68 285 Z" fill="#C990A8" opacity="0.45" />
          {/* Collar */}
          <path d="M95 198 Q110 212 125 198" stroke="#B87A95" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Neck */}
          <rect x="102" y="172" width="16" height="28" rx="8" fill="#F0D5C5" />

          {/* Head */}
          <ellipse cx="110" cy="146" rx="40" ry="44" fill="#F4DDD0" />

          {/* Hair */}
          <ellipse cx="110" cy="116" rx="42" ry="24" fill="#4A2C20" />
          <ellipse cx="72" cy="138" rx="11" ry="20" fill="#4A2C20" />
          <ellipse cx="148" cy="138" rx="11" ry="20" fill="#4A2C20" />
          {/* Flowing hair strand */}
          <motion.path
            d="M70 126 Q60 148 65 170"
            stroke="#4A2C20"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            animate={{ d: ["M70 126 Q60 148 65 170", "M70 126 Q58 146 62 170", "M70 126 Q60 148 65 170"] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Eyes */}
          <motion.g
            animate={{ scaleY: [1, 1, 0.07, 1, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.42, 0.48, 0.54, 1], ease: "easeInOut", repeatDelay: 2 }}
            style={{ transformOrigin: "96px 149px" }}
          >
            <ellipse cx="96" cy="149" rx="5.5" ry="6" fill="#2E1A12" />
            <circle cx="98" cy="147" r="1.4" fill="white" opacity="0.85" />
          </motion.g>
          <motion.g
            animate={{ scaleY: [1, 1, 0.07, 1, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.42, 0.48, 0.54, 1], ease: "easeInOut", repeatDelay: 2 }}
            style={{ transformOrigin: "124px 149px" }}
          >
            <ellipse cx="124" cy="149" rx="5.5" ry="6" fill="#2E1A12" />
            <circle cx="126" cy="147" r="1.4" fill="white" opacity="0.85" />
          </motion.g>

          {/* Cheeks */}
          <ellipse cx="88" cy="160" rx="9" ry="5.5" fill="#EDA0A0" opacity="0.28" />
          <ellipse cx="132" cy="160" rx="9" ry="5.5" fill="#EDA0A0" opacity="0.28" />

          {/* Left arm */}
          <motion.path
            d="M70 225 Q52 255 55 295"
            stroke="#F0D0BC"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
            animate={
              isSpeaking
                ? { d: ["M70 225 Q52 255 55 295", "M70 215 Q38 228 32 200", "M70 225 Q52 255 55 295"] }
                : {}
            }
            transition={{ duration: 1.5, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }}
          />
          <motion.ellipse
            cx="55" cy="296" rx="8" ry="7"
            fill="#F4DDD0"
            animate={isSpeaking ? { cx: [55, 32, 55], cy: [296, 200, 296] } : {}}
            transition={{ duration: 1.5, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }}
          />

          {/* Right arm */}
          <motion.path
            d="M150 225 Q168 255 165 295"
            stroke="#F0D0BC"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
            animate={
              isSpeaking
                ? { d: ["M150 225 Q168 255 165 295", "M150 215 Q182 205 192 178", "M150 225 Q168 255 165 295"] }
                : {}
            }
            transition={{ duration: 1.5, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut", delay: 0.25 }}
          />
          <motion.ellipse
            cx="165" cy="296" rx="8" ry="7"
            fill="#F4DDD0"
            animate={isSpeaking ? { cx: [165, 193, 165], cy: [296, 178, 296] } : {}}
            transition={{ duration: 1.5, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut", delay: 0.25 }}
          />

          {/* Legs */}
          <rect x="89" y="330" width="18" height="8" rx="4" fill="#C990A8" />
          <rect x="113" y="330" width="18" height="8" rx="4" fill="#B87A95" />
        </svg>

        <div
          className="text-center mt-2 font-sans font-medium uppercase tracking-widest"
          style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.7rem)", color: "#A07060", letterSpacing: "0.2em" }}
        >
          Customer
        </div>
      </motion.div>
    </div>
  );
}
