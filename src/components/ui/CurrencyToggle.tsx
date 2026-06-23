"use client";

import { motion } from "framer-motion";

type Currency = "BDT" | "EUR";

interface CurrencyToggleProps {
  currency: Currency;
  onChange: (c: Currency) => void;
}

const options: { value: Currency; label: string }[] = [
  { value: "BDT", label: "৳ BDT" },
  { value: "EUR", label: "€ EUR" },
];

/** Segmented BDT / EUR control with an animated active pill. */
export default function CurrencyToggle({ currency, onChange }: CurrencyToggleProps) {
  return (
    <div
      role="group"
      aria-label="Display currency"
      className="relative inline-flex rounded-full border border-line bg-surface p-1"
    >
      {options.map((opt) => {
        const active = currency === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`relative z-10 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? "text-white" : "text-muted hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId="currency-pill"
                className="absolute inset-0 -z-10 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
