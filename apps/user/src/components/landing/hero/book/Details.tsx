import React from "react";
import { type DetailType } from "./pages";

export function Details({ type, accentColor }: { type: DetailType; accentColor?: string }) {
  const gold = accentColor ?? "#D4AF37";

  if (type === "none") return null;

  return (
    // Its own container, so `cqi` below measures against the page — Details is
    // a sibling of Writing, not a child, and can't borrow Writing's.
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ containerType: "inline-size" }}
      aria-hidden="true"
    >

      {/* ── Gold Foil Underline ── warm glow line + shimmer dot */}
      {type === "gold-foil-underline" && (
        <>
          <div
            className="absolute"
            style={{
              top: "66%",
              left: "12%",
              width: "76%",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${gold}44 10%, ${gold}cc 30%, #FFF8DC 50%, ${gold}cc 70%, ${gold}44 90%, transparent)`,
            }}
          />
          <div
            className="absolute"
            style={{
              top: "66.5%",
              left: "12%",
              width: "76%",
              height: "0.5px",
              background: `linear-gradient(90deg, transparent, ${gold}22 20%, ${gold}55 50%, transparent)`,
            }}
          />
          {/* Corner ornaments */}
          <div className="absolute top-[8%] left-[8%] w-1 h-1 opacity-25"
            style={{ borderTop: `1px solid ${gold}`, borderLeft: `1px solid ${gold}` }} />
          <div className="absolute top-[8%] right-[8%] w-1 h-1 opacity-25"
            style={{ borderTop: `1px solid ${gold}`, borderRight: `1px solid ${gold}` }} />
          <div className="absolute bottom-[8%] left-[8%] w-1 h-1 opacity-25"
            style={{ borderBottom: `1px solid ${gold}`, borderLeft: `1px solid ${gold}` }} />
          <div className="absolute bottom-[8%] right-[8%] w-1 h-1 opacity-25"
            style={{ borderBottom: `1px solid ${gold}`, borderRight: `1px solid ${gold}` }} />
        </>
      )}

      {/* ── Ink Flourish ── large, organic SVG calligraphic swirl */}
      {type === "ink-flourish" && (
        <svg
          className="absolute"
          style={{ bottom: "8%", right: "6%", width: "28%", opacity: 0.18 }}
          viewBox="0 0 120 80"
          fill="none"
          stroke="#1A1A2E"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M10,60 C20,20 50,10 80,30 S110,70 90,60 S50,30 40,50 S50,80 70,70" />
          <path d="M70,70 C80,65 95,55 100,45" strokeWidth="0.8" opacity="0.5" />
          <path d="M15,65 C12,68 8,70 5,68" strokeWidth="0.8" />
        </svg>
      )}

      {/* ── Ribbon Bookmark ── silk ribbon peeking from the top */}
      {type === "ribbon-bookmark" && (
        <div
          className="absolute top-0"
          style={{
            right: "18%",
            width: "18px",
            height: "42%",
            background: "linear-gradient(180deg, #8C2323 0%, #6B1818 100%)",
            boxShadow: "2px 2px 6px rgba(0,0,0,0.25)",
            clipPath: "polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)",
          }}
        >
          {/* Silk sheen */}
          <div
            className="absolute inset-y-0 left-0 w-[30%]"
            style={{ background: "linear-gradient(to right, rgba(255,255,255,0.25), transparent)" }}
          />
        </div>
      )}

      {/* ── Pencil Margin Note ── rotated italic note in the outer margin */}
      {type === "pencil-margin-note" && (
        <>
          <div
            className="absolute"
            style={{
              top: "22%",
              left: "3%",
              width: "10%",
              height: "56%",
              borderRight: "0.5px solid rgba(74,74,74,0.2)",
            }}
          />
          <span
            className="absolute"
            style={{
              top: "35%",
              left: "2%",
              width: "9%",
              fontSize: "2.7cqi",
              fontFamily: "var(--font-secondary)",
              color: "#4A4A4A",
              opacity: 0.45,
              transform: "rotate(-90deg)",
              transformOrigin: "center center",
              whiteSpace: "nowrap",
              letterSpacing: "0.08em",
            }}
          >
            Roohae · crafted with care
          </span>
        </>
      )}

      {/* ── Watercolour Splash ── large soft wash in corner */}
      {type === "watercolor-splash" && (
        <>
          <div
            className="absolute"
            style={{
              bottom: "-5%",
              right: "-5%",
              width: "50%",
              height: "50%",
              borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
              background: "radial-gradient(circle at 40% 40%, #93C5FD55 0%, #60A5FA22 50%, transparent 75%)",
              filter: "blur(18px)",
              mixBlendMode: "multiply",
            }}
          />
          <div
            className="absolute"
            style={{
              top: "5%",
              left: "-8%",
              width: "35%",
              height: "35%",
              borderRadius: "50%",
              background: "radial-gradient(circle, #BAE6FD33 0%, transparent 70%)",
              filter: "blur(12px)",
              mixBlendMode: "multiply",
            }}
          />
        </>
      )}

      {/* ── Pressed Flower ── layered organic petal shape */}
      {type === "pressed-flower" && (
        <div
          className="absolute"
          style={{
            bottom: "10%",
            right: "8%",
            width: "18%",
            height: "22%",
            opacity: 0.65,
            mixBlendMode: "multiply",
          }}
        >
          {/* Petals */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                width: "38%",
                height: "55%",
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                background: "radial-gradient(ellipse at 50% 30%, #E879F9cc, #DDA0DD88)",
                transform: `translate(-50%, -100%) rotate(${deg}deg)`,
                transformOrigin: "50% 100%",
                opacity: 0.7,
              }}
            />
          ))}
          {/* Centre */}
          <div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              width: "20%",
              height: "20%",
              borderRadius: "50%",
              background: "#FDE68A",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      )}

      {/* ── Calligraphic Border ── used on the finale page */}
      {type === "calligraphic-border" && (
        <>
          {/* Outer rectangle */}
          <div
            className="absolute"
            style={{
              inset: "7%",
              border: `0.5px solid ${gold}44`,
            }}
          />
          {/* Inner rectangle */}
          <div
            className="absolute"
            style={{
              inset: "9.5%",
              border: `0.5px solid ${gold}22`,
            }}
          />
          {/* Corner diamonds */}
          {[
            { top: "6.2%", left: "6.2%" },
            { top: "6.2%", right: "6.2%" },
            { bottom: "6.2%", left: "6.2%" },
            { bottom: "6.2%", right: "6.2%" },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-2 h-2"
              style={{
                ...pos,
                background: gold,
                opacity: 0.35,
                transform: "rotate(45deg)",
              }}
            />
          ))}
        </>
      )}

    </div>
  );
}
