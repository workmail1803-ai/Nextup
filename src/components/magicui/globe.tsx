"use client";

// Adapted from Magic UI — framer-motion import + warm dark config with
// markers on Dhaka and NextUp's European destination cities.
import { useEffect, useRef } from "react";
import createGlobe, { type COBEOptions } from "cobe";
import { useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

const MOVEMENT_DAMPING = 1400;

const GLOBE_CONFIG: Omit<COBEOptions, "onRender"> = {
  width: 800,
  height: 800,
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.32,
  dark: 1,
  diffuse: 1.1,
  mapSamples: 9000,
  mapBrightness: 5.2,
  baseColor: [0.36, 0.33, 0.29], // warm dark landmass
  markerColor: [0.88, 0.57, 0.12], // bronze
  glowColor: [0.22, 0.17, 0.11], // warm glow
  markers: [
    { location: [23.8103, 90.4125], size: 0.11 }, // Dhaka (home)
    { location: [41.9028, 12.4964], size: 0.07 }, // Rome
    { location: [45.4642, 9.19], size: 0.05 }, // Milan
    { location: [44.4949, 11.3426], size: 0.05 }, // Bologna
    { location: [52.52, 13.405], size: 0.07 }, // Berlin
    { location: [48.1351, 11.582], size: 0.05 }, // Munich
    { location: [54.6872, 25.2797], size: 0.06 }, // Vilnius
    { location: [52.2297, 21.0122], size: 0.06 }, // Warsaw
    { location: [47.4979, 19.0402], size: 0.06 }, // Budapest
  ],
};

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string;
  config?: Omit<COBEOptions, "onRender">;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(0);
  const widthRef = useRef(0);
  const pointerInteracting = useRef<number | null>(null);

  const r = useMotionValue(0);
  const rs = useSpring(r, { mass: 1, damping: 30, stiffness: 100 });

  const updateInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      r.set(r.get() + delta / MOVEMENT_DAMPING);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let globe: ReturnType<typeof createGlobe> | null = null;
    // Cap render resolution. Retina supersampling (×2) is the biggest cost on
    // cobe; ~1.4× stays crisp at a fraction of the GPU/CPU load.
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.4);
    const onResize = () => (widthRef.current = canvas.offsetWidth);

    // Only render while visible — frees the GPU when scrolled away
    // (matters on the low-end phones much of our audience uses).
    const start = () => {
      if (globe) return;
      window.addEventListener("resize", onResize);
      onResize();
      globe = createGlobe(canvas, {
        ...config,
        devicePixelRatio: dpr,
        width: widthRef.current * dpr,
        height: widthRef.current * dpr,
        onRender: (state) => {
          if (!pointerInteracting.current && !reduce) phiRef.current += 0.0035;
          state.phi = phiRef.current + rs.get();
          state.width = widthRef.current * dpr;
          state.height = widthRef.current * dpr;
        },
      });
      requestAnimationFrame(() => (canvas.style.opacity = "0.9"));
    };

    const stop = () => {
      if (globe) {
        globe.destroy();
        globe = null;
      }
      window.removeEventListener("resize", onResize);
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.05 }
    );
    io.observe(canvas);

    return () => {
      io.disconnect();
      stop();
    };
  }, [rs, config]);

  return (
    <div className={cn("absolute inset-0 mx-auto aspect-square w-full max-w-[600px]", className)}>
      <canvas
        className="size-full opacity-0 transition-opacity duration-700 [contain:layout_paint_size]"
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX;
          updateInteraction(e.clientX);
        }}
        onPointerUp={() => updateInteraction(null)}
        onPointerOut={() => updateInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) => e.touches[0] && updateMovement(e.touches[0].clientX)}
      />
    </div>
  );
}
