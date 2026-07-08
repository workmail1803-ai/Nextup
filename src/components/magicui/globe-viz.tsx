"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// cobe loads as its own lazy chunk — never ships in the initial bundle.
const Globe = dynamic(() => import("./globe").then((m) => m.Globe), { ssr: false });

/**
 * Performance-aware globe host:
 *  - WebGL globe only on capable devices (≥768px, motion allowed)
 *  - mounts only when scrolled into view (IntersectionObserver)
 *  - lightweight CSS fallback everywhere else (mobile / reduced motion)
 */
export default function GlobeViz() {
  const ref = useRef<HTMLDivElement>(null);
  const [capable, setCapable] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Capability check depends on window; only knowable after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCapable(!reduce && window.innerWidth >= 768);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setInView(true),
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative aspect-square w-full">
      {capable && inView ? <Globe /> : <StaticGlobe />}
    </div>
  );
}

/** Pure-CSS stand-in: a soft bronze sphere with orbit lines. Near-zero cost. */
function StaticGlobe() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="relative aspect-square w-[78%]">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 38% 32%, rgba(224,146,31,0.28), rgba(224,146,31,0.06) 45%, transparent 62%), radial-gradient(circle at 50% 50%, #221b12, #15110b 70%)",
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.6), 0 0 80px rgba(224,146,31,0.12)",
          }}
        />
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-[14%] rounded-[50%] border border-white/8" />
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/8" />
        {/* a few destination dots */}
        {[
          { t: "30%", l: "58%" },
          { t: "44%", l: "44%" },
          { t: "56%", l: "62%" },
          { t: "62%", l: "40%" },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-accent-bright"
            style={{ top: p.t, left: p.l, boxShadow: "0 0 8px rgba(224,146,31,0.8)" }}
          />
        ))}
      </div>
    </div>
  );
}
