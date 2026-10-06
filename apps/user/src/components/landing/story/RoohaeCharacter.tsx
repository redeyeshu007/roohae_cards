/**
 * FILE PURPOSE:
 * Animated brand persona illustration component ("Roohae") for the storytelling section.
 *
 * MAIN RESPONSIBILITY:
 * Renders the designer vector persona with brand badge, gestural arm motion, smiling lip sync,
 * and design tablet notepad accessories during interactive story stages.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/story/ConversationStory.tsx
 */

"use client";

import { motion } from "framer-motion";

interface RoohaeCharacterProps {
  isSpeaking: boolean;
}

export function RoohaeCharacter({ isSpeaking }: RoohaeCharacterProps) {
  return (
    <div className="relative flex flex-col items-start justify-end h-full w-full select-none">
      {/* Brand glow aura behind character */}
      <motion.div
        className="absolute bottom-10 left-0"
        style={{
          width: "clamp(120px, 15vw, 220px)",
          height: "clamp(120px, 15vw, 220px)",
          background: "radial-gradient(ellipse at center, rgba(217,140,166,0.22) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.12, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        animate={
          isSpeaking
            ? { y: [0, -14, -6, -14, -4, 0], rotate: [-1, 1, -1, 0.5, -0.5, 0] }
            : { y: [0, -12, -5, -12, 0], rotate: [0, 0.5, -0.5, 0] }
        }
        transition={{ duration: isSpeaking ? 3.2 : 4.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex flex-col items-center"
        style={{ width: "clamp(120px, 15vw, 220px)" }}
      >
        <svg
          viewBox="0 0 220 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          aria-hidden="true"
        >
          {/* Floating shadow */}
          <motion.ellipse
            cx="110"
            cy="375"
            rx="52"
            ry="7"
            fill="#D98CA6"
            animate={{ opacity: [0.12, 0.28, 0.12], rx: [52, 42, 52] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Body — structured tunic */}
          <motion.path
            d="M72 215 Q64 310 62 365 L158 365 Q156 310 148 215 Z"
            fill="#C8879E"
            animate={
              isSpeaking
                ? {
                    d: [
                      "M72 215 Q64 310 62 365 L158 365 Q156 310 148 215 Z",
                      "M72 212 Q65 308 63 363 L157 363 Q155 308 147 212 Z",
                      "M72 215 Q64 310 62 365 L158 365 Q156 310 148 215 Z",
                    ],
                  }
                : {}
            }
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Tunic highlight */}
          <path d="M82 216 Q110 230 138 216 L148 270 Q110 280 72 270 Z" fill="#E0A0B8" opacity="0.5" />

          {/* Belt accent */}
          <rect x="76" y="262" width="68" height="5" rx="2.5" fill="#A06080" opacity="0.6" />

          {/* Neckline */}
          <path d="M97 196 Q110 208 123 196" stroke="#A06080" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* ── ROOHAE LOGO on dress ── */}
          {/* Logo badge circle background */}
          <motion.circle
            cx="110"
            cy="240"
            r="18"
            fill="#FFFDF9"
            opacity="0.92"
            animate={{ opacity: [0.88, 1, 0.88] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Logo ring */}
          <circle cx="110" cy="240" r="18" stroke="#D98CA6" strokeWidth="1.2" fill="none" opacity="0.6" />
          {/* Stylized "R" lettermark */}
          <text
            x="110"
            y="246"
            textAnchor="middle"
            fill="#C8879E"
            fontSize="14"
            fontWeight="800"
            fontFamily="serif"
            letterSpacing="-0.5"
          >
            R
          </text>
          {/* Small sparkle on logo */}
          <motion.g
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            style={{ transformOrigin: "124px 226px" }}
          >
            <path d="M124 223 L124.5 225 L126 225.5 L124.5 226 L124 228 L123.5 226 L122 225.5 L123.5 225 Z" fill="#D98CA6" opacity="0.9" />
          </motion.g>

          {/* Neck */}
          <rect x="103" y="172" width="14" height="26" rx="7" fill="#F2D8C8" />

          {/* Head */}
          <ellipse cx="110" cy="146" rx="38" ry="42" fill="#F6E0CE" />

          {/* Hair — sophisticated updo + wavy strands */}
          <ellipse cx="110" cy="113" rx="40" ry="22" fill="#6B3A2A" />
          <ellipse cx="74" cy="133" rx="10" ry="18" fill="#6B3A2A" />
          <ellipse cx="146" cy="133" rx="10" ry="18" fill="#6B3A2A" />
          {/* Bun */}
          <ellipse cx="110" cy="100" rx="18" ry="14" fill="#6B3A2A" />
          <ellipse cx="110" cy="96" rx="12" ry="9" fill="#7A4535" />
          {/* Hair pins / accessories */}
          <motion.line
            x1="98" y1="95" x2="110" y2="90"
            stroke="#D98CA6" strokeWidth="2" strokeLinecap="round"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "98px 95px" }}
          />
          {/* Side wavy strand */}
          <motion.path
            d="M148 124 Q158 142 154 164"
            stroke="#6B3A2A"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            animate={{ d: ["M148 124 Q158 142 154 164", "M148 124 Q162 138 158 164", "M148 122 Q158 142 154 164", "M148 124 Q158 142 154 164"] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Left wavy strand */}
          <motion.path
            d="M72 128 Q62 146 67 168"
            stroke="#6B3A2A"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            animate={{ d: ["M72 128 Q62 146 67 168", "M72 128 Q60 142 64 168", "M72 128 Q62 146 67 168"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />

          {/* Eyes — calm, confident */}
          <motion.g
            animate={{ scaleY: [1, 1, 0.07, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.46, 0.5, 0.54, 1], ease: "easeInOut", repeatDelay: 2.5 }}
            style={{ transformOrigin: "96px 148px" }}
          >
            <ellipse cx="96" cy="148" rx="5.5" ry="6" fill="#3A2018" />
            <circle cx="98" cy="146" r="1.5" fill="white" opacity="0.9" />
          </motion.g>
          <motion.g
            animate={{ scaleY: [1, 1, 0.07, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.46, 0.5, 0.54, 1], ease: "easeInOut", repeatDelay: 2.5 }}
            style={{ transformOrigin: "124px 148px" }}
          >
            <ellipse cx="124" cy="148" rx="5.5" ry="6" fill="#3A2018" />
            <circle cx="126" cy="146" r="1.5" fill="white" opacity="0.9" />
          </motion.g>

          {/* Eyebrows — expressive when speaking */}
          <motion.path
            d="M88 136 Q96 132 104 135"
            stroke="#5A2A1A"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            animate={isSpeaking ? { d: ["M88 136 Q96 132 104 135", "M88 133 Q96 129 104 132", "M88 136 Q96 132 104 135"] } : {}}
            transition={{ duration: 1.2, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }}
          />
          <motion.path
            d="M116 135 Q124 132 132 136"
            stroke="#5A2A1A"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            animate={isSpeaking ? { d: ["M116 135 Q124 132 132 136", "M116 132 Q124 129 132 133", "M116 135 Q124 132 132 136"] } : {}}
            transition={{ duration: 1.2, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut", delay: 0.1 }}
          />

          {/* Warm smile */}
          <motion.path
            d="M101 163 Q110 170 119 163"
            stroke="#C07080"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            animate={isSpeaking ? { d: ["M101 163 Q110 172 119 163", "M102 162 Q110 168 118 162", "M101 163 Q110 172 119 163"] } : {}}
            transition={{ duration: 1.4, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }}
          />

          {/* Cheeks */}
          <motion.ellipse
            cx="89" cy="160" rx="9" ry="5"
            fill="#F0A0B0"
            animate={{ opacity: isSpeaking ? [0.3, 0.5, 0.3] : [0.25, 0.35, 0.25] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse
            cx="131" cy="160" rx="9" ry="5"
            fill="#F0A0B0"
            animate={{ opacity: isSpeaking ? [0.3, 0.5, 0.3] : [0.25, 0.35, 0.25] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />

          {/* Left arm — gesturing when speaking */}
          <motion.path
            d="M72 220 Q54 248 58 286"
            stroke="#F0D0BC"
            strokeWidth="15"
            strokeLinecap="round"
            fill="none"
            animate={
              isSpeaking
                ? { d: ["M72 220 Q54 248 58 286", "M72 208 Q42 218 34 192", "M72 218 Q50 238 52 272", "M72 220 Q54 248 58 286"] }
                : { d: ["M72 220 Q60 244 62 278", "M72 222 Q58 248 60 280", "M72 220 Q60 244 62 278"] }
            }
            transition={{ duration: isSpeaking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse
            cx="58" cy="287" rx="7" ry="6.5"
            fill="#F6E0CE"
            animate={isSpeaking ? { cx: [58, 34, 52, 58], cy: [287, 192, 272, 287] } : { cx: [62, 60, 62], cy: [278, 280, 278] }}
            transition={{ duration: isSpeaking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Right arm — presenting design */}
          <motion.path
            d="M148 220 Q166 248 162 286"
            stroke="#F0D0BC"
            strokeWidth="15"
            strokeLinecap="round"
            fill="none"
            animate={
              isSpeaking
                ? { d: ["M148 220 Q166 248 162 286", "M148 206 Q180 196 192 168", "M148 218 Q170 242 166 278", "M148 220 Q166 248 162 286"] }
                : { d: ["M148 220 Q160 244 158 278", "M148 222 Q162 248 160 282", "M148 220 Q160 244 158 278"] }
            }
            transition={{ duration: isSpeaking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          <motion.ellipse
            cx="162" cy="287" rx="7" ry="6.5"
            fill="#F6E0CE"
            animate={isSpeaking ? { cx: [162, 192, 166, 162], cy: [287, 168, 278, 287] } : { cx: [158, 160, 158], cy: [278, 282, 278] }}
            transition={{ duration: isSpeaking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />

          {/* Design tool / notepad in hand */}
          <motion.g
            animate={isSpeaking ? { rotate: [-6, 6, -6], x: [0, 3, 0], y: [0, -2, 0] } : { rotate: [0, 1, 0] }}
            transition={{ duration: isSpeaking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            style={{ transformOrigin: "175px 200px" }}
          >
            <rect x="168" y="188" width="20" height="26" rx="3" fill="#FFFDF9" opacity="0.9" />
            <line x1="172" y1="195" x2="184" y2="195" stroke="#D98CA6" strokeWidth="1.3" />
            <line x1="172" y1="200" x2="184" y2="200" stroke="#D98CA6" strokeWidth="1.3" />
            <line x1="172" y1="205" x2="180" y2="205" stroke="#D98CA6" strokeWidth="1.3" />
            {/* Pen */}
            <rect x="185" y="192" width="3" height="14" rx="1.5" fill="#C8879E" opacity="0.8" transform="rotate(-20, 185, 196)" />
          </motion.g>

          {/* Legs */}
          <rect x="90" y="360" width="16" height="8" rx="4" fill="#C8879E" />
          <rect x="114" y="360" width="16" height="8" rx="4" fill="#A06080" />

          {/* Sparkle elements */}
          <motion.g
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.1, 0.4], rotate: [0, 45, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            style={{ transformOrigin: "198px 138px" }}
          >
            <path d="M198 131 L199.2 135.5 L204 136.5 L199.2 137.5 L198 142 L196.8 137.5 L192 136.5 L196.8 135.5 Z" fill="#D98CA6" opacity="0.85" />
          </motion.g>
          <motion.g
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
            style={{ transformOrigin: "26px 200px" }}
          >
            <path d="M26 195 L27.2 198.5 L31 199.5 L27.2 200.5 L26 204 L24.8 200.5 L21 199.5 L24.8 198.5 Z" fill="#D98CA6" opacity="0.65" />
          </motion.g>
          {/* Third sparkle near logo */}
          <motion.g
            animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1, 0.3], rotate: [0, 30, 60] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            style={{ transformOrigin: "132px 222px" }}
          >
            <path d="M132 219 L132.8 221.5 L135.5 222 L132.8 222.5 L132 225 L131.2 222.5 L128.5 222 L131.2 221.5 Z" fill="#F0B0C8" opacity="0.8" />
          </motion.g>
        </svg>

        <div
          className="text-center mt-2 font-sans font-semibold uppercase tracking-widest"
          style={{ fontSize: "clamp(0.5rem, 0.8vw, 0.7rem)", color: "#A06080", letterSpacing: "0.22em" }}
        >
          Roohae
        </div>
      </motion.div>
    </div>
  );
}
