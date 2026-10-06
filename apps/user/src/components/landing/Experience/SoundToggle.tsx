/**
 * FILE PURPOSE:
 * Audio mute/unmute control button for the landing experience video player.
 *
 * MAIN RESPONSIBILITY:
 * Toggles audio volume state with animated Volume2 / VolumeX icon transitions.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/Experience/VideoPlayer.tsx
 */

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

interface SoundToggleProps {
  isMuted: boolean;
  onClick: () => void;
}

export function SoundToggle({ isMuted, onClick }: SoundToggleProps) {
  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`absolute bottom-6 right-6 md:bottom-2 md:right-2 flex items-center justify-center w-3 h-3 rounded-full border border-black/10 shadow-sm z-10 transition-colors duration-300 ${
        !isMuted ? "bg-[#FF69B4]" : "bg-[rgba(255,255,255,0.9)]"
      }`}
      aria-label={isMuted ? "Unmute video" : "Mute video"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isMuted ? "muted" : "unmuted"}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-black" />
          ) : (
            <Volume2 className="w-5 h-5 text-black" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
