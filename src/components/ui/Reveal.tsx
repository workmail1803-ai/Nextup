"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import { ease, viewportOnce } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  /** Stagger index — multiplies the base delay. */
  delay?: number;
  /** Travel distance in px (set 0 for pure fade). */
  y?: number;
  className?: string;
  as?: ElementType;
}

/**
 * Scroll-triggered reveal. Honors `prefers-reduced-motion` by rendering
 * the content statically (no transform, no fade-in delay).
 */
export default function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion(as as ElementType);

  if (reduce) {
    const Tag = as as ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.62, ease, delay }}
    >
      {children}
    </MotionTag>
  );
}
