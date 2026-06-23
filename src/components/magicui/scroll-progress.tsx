"use client";

// Adapted from Magic UI — framer-motion import + bronze gradient.
import { motion, useScroll, type MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type ScrollProgressProps = Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps>;

export function ScrollProgress({ className, ...props }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className={cn(
        "fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#a85a1a] via-[#c2701f] to-[#e0921f]",
        className
      )}
      style={{ scaleX: scrollYProgress }}
      {...props}
    />
  );
}
