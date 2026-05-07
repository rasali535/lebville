import React from "react";

export default function Marquee({ items }) {
  const phrases = items || [
    "Where elegance meets exclusivity",
    "HL/SKIN Beauty — Couture color",
    "Free delivery over BWP 1,000",
    "Botswana-loved, Gaborone-made",
  ];
  const display = [...phrases, ...phrases, ...phrases];
  return (
    <div data-testid="editorial-marquee" className="relative py-5 bg-sand/30 border-y border-espresso/5 overflow-hidden">
      <div className="marquee-track">
        {display.map((p, i) => (
          <span key={i} className="font-serif italic text-lg sm:text-xl tracking-wide text-espresso px-12 whitespace-nowrap">
            {p}
            <span className="text-terracotta mx-8">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
