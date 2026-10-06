/**
 * FILE PURPOSE:
 * 3D Book front cover component with embossed gold foil brand logo and leather texture.
 *
 * MAIN RESPONSIBILITY:
 * Renders realistic book cover materials with subtle ambient lighting, spine gradient hinge shadows,
 * and gold foil logo stamping.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/hero/book/OpenBook.tsx
 */

import React from "react";
import Image from "next/image";

export function Cover() {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-r-[3px]"
      style={{
        background: "linear-gradient(160deg, #3A2C1E 0%, #2A1F14 50%, #1E1510 100%)",
        boxShadow: "inset -3px 0 8px rgba(0,0,0,0.4)",
      }}
    >
      {/* Fine leather / linen grain */}
      <div className="absolute inset-0 paper-texture opacity-30 mix-blend-overlay" />

      {/* Soft ambient light from top-left — gives the cover depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(255,220,160,0.08) 0%, transparent 65%)",
        }}
      />

      {/* Spine gradient — hinge shadow */}
      <div
        className="absolute inset-y-0 left-0 w-[14%]"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.55), rgba(0,0,0,0.1) 60%, rgba(0,0,0,0))",
        }}
      />

      {/* Fore-edge highlight */}
      <div
        className="absolute inset-y-0 right-0 w-[5%]"
        style={{
          background:
            "linear-gradient(to left, rgba(255,220,160,0.18), rgba(255,220,160,0))",
        }}
      />

      {/* Very subtle horizontal grain lines — like cloth binding */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 4px)",
        }}
      />

      {/* Centred Roohae logo — the exact navbar image */}
      <div className="absolute inset-0 flex items-center justify-center px-[18%]">
        <div
          style={{
            filter:
              "brightness(0) invert(1) sepia(1) saturate(0.4) hue-rotate(5deg) opacity(0.88)",
          }}
        >
          <Image
            src="/logo.png"
            alt="Roohae Cards"
            width={969}
            height={377}
            className="w-full h-auto"
            style={{ maxWidth: "160px" }}
            priority
          />
        </div>
      </div>

      {/* Subtle gold foil emboss ring around logo */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            width: "54%",
            paddingBottom: "22%",
            border: "0.5px solid rgba(212,175,55,0.18)",
            borderRadius: "2px",
          }}
        />
      </div>
    </div>
  );
}
