"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}

/** Generic centered modal with backdrop blur, scroll, and enter/exit motion. */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[125] flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="fixed inset-0"
            style={{ background: "rgba(6,5,3,0.62)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "nx-card relative my-4 w-full shadow-[var(--nx-shadow-lg)]",
              size === "lg" ? "max-w-2xl" : "max-w-lg",
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: "var(--nx-edge)" }}>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--nx-text)" }}>
                  {title}
                </h3>
                {description && (
                  <p className="mt-0.5 text-sm" style={{ color: "var(--nx-muted)" }}>
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-white/5"
                style={{ color: "var(--nx-faint)" }}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">{children}</div>

            {footer && (
              <div className="flex justify-end gap-2.5 border-t p-4" style={{ borderColor: "var(--nx-edge)" }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
