"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback if onLoadedData doesn't fire
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      video.volume = 0;
      setIsMuted(false);

      let vol = 0;
      const interval = 30;
      const step = interval / 600; // 600ms fade
      const fadeIn = setInterval(() => {
        if (vol < 1) {
          vol += step;
          video.volume = Math.min(vol, 1);
        } else {
          clearInterval(fadeIn);
        }
      }, interval);
    } else {
      let vol = video.volume;
      const interval = 30;
      const step = interval / 600;
      setIsMuted(true);

      const fadeOut = setInterval(() => {
        if (vol > 0) {
          vol -= step;
          video.volume = Math.max(vol, 0);
        } else {
          clearInterval(fadeOut);
          video.muted = true;
        }
      }, interval);
    }
  };

  return (
    <div className="w-full mt-14 md:mt-6">
      <motion.div
        className="relative w-full h-[60vh] md:h-[80vh] lg:h-screen overflow-hidden cursor-pointer"
        onClick={toggleSound}
      >
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-[#1E1E1E] flex flex-col items-center justify-center z-20"
            >
              <h3 className="font-sans font-extrabold text-2xl tracking-widest text-[#F5C3D2] mb-2 uppercase">ROOHAE</h3>
              <p className="font-sans text-[#F5C3D2]/60 text-sm tracking-widest uppercase">Loading Experience...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <video
          ref={videoRef}
          src="/videos/brand-film.mp4"
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setIsLoading(false)}
        />
      </motion.div>
    </div>
  );
}
