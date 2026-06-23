import type { Variants, Transition } from "framer-motion";

/* Shared motion language — calm, editorial, purposeful.
   Durations and easing mirror the CSS tokens in globals.css. */

export const ease = [0.22, 1, 0.36, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

export const spring: Transition = { type: "spring", stiffness: 260, damping: 30 };

/** Single-element reveal: rise + fade. */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease, delay: i * 0.08 },
  }),
};

/** Container that staggers its children on enter. */
export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/** Child item for `stagger` containers. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

/** Subtle scale-in for media / cards. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease } },
};

export const viewportOnce = { once: true, margin: "-12% 0px -12% 0px" } as const;
