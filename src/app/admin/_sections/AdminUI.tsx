"use client";

// Admin design primitives — professional, restrained, consistent.
// Used across all admin section files.

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export type Tone = "green" | "amber" | "red" | "blue" | "slate" | "purple";

const TONE: Record<Tone, string> = {
  green:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  red:    "bg-red-500/10 text-red-400 border-red-500/20",
  blue:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  slate:  "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function Badge({
  label,
  tone = "slate",
  dot = false,
  pulse = false,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4 ${TONE[tone]}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      )}
      {label}
    </span>
  );
}

export function AdminModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`admin-card relative my-4 w-full ${wide ? "max-w-2xl" : "max-w-lg"}`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--ad-border)] px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--ad-text)]">{title}</h3>
                {subtitle && <p className="mt-0.5 text-[13px] text-[var(--ad-text-tertiary)]">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-md p-1 text-[var(--ad-text-quaternary)] transition-colors hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text-secondary)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer && (
              <div className="flex justify-end gap-2 border-t border-[var(--ad-border)] px-5 py-3">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Shared control classes
export const input =
  "w-full rounded-lg bg-[var(--ad-bg-raised)] px-3 py-2 text-[13px] text-[var(--ad-text)] border border-[var(--ad-border)] focus:border-[var(--ad-accent)] focus:ring-1 focus:ring-[var(--ad-accent)]/20 focus:outline-none transition-colors placeholder:text-[var(--ad-text-quaternary)]";
export const label = "block text-[12px] font-medium text-[var(--ad-text-tertiary)] mb-1.5";
export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--ad-accent)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--ad-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-transparent text-[var(--ad-text-secondary)] rounded-lg text-[13px] font-medium border border-[var(--ad-border)] hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)] transition-colors";
export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-[13px] font-medium hover:bg-red-500/15 transition-colors";
