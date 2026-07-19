import React from "react";

export function Page({ color, spine }: { color: string; spine: "left" | "right" }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: color }}>
      {/* Paper texture */}
      <div className="absolute inset-0 paper-texture opacity-60 mix-blend-multiply" />
      
      {/* The gutter shadow — paper curving down into the spine. */}
      <div
        className="absolute inset-y-0 w-[14%] mix-blend-multiply"
        style={{
          [spine === "left" ? "left" : "right"]: 0,
          background: `linear-gradient(to ${spine === "left" ? "right" : "left"}, rgba(40,30,20,0.18), rgba(40,30,20,0))`,
        }}
      />
      
      {/* Ambient edge highlight */}
      <div
        className="absolute inset-y-0 w-[4%]"
        style={{
          [spine === "left" ? "right" : "left"]: 0,
          background: `linear-gradient(to ${spine === "left" ? "left" : "right"}, rgba(255,255,255,0.4), rgba(255,255,255,0))`,
        }}
      />
    </div>
  );
}
