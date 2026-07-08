"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
}

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

const TONE = {
  success: { color: "var(--nx-positive)", bg: "var(--nx-positive-soft)", Icon: CheckCircle2 },
  error: { color: "var(--nx-danger)", bg: "var(--nx-danger-soft)", Icon: TriangleAlert },
  info: { color: "var(--nx-info)", bg: "var(--nx-info-soft)", Icon: Info },
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, tone = "info", durationMs = 4000 }: ToastInput) => {
      const id = ++idRef.current;
      setItems((prev) => [...prev, { id, title, description, tone }]);
      window.setTimeout(() => remove(id), durationMs);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const { color, bg, Icon } = TONE[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="nx-glass pointer-events-auto flex items-start gap-3 rounded-xl p-3.5 shadow-[var(--nx-shadow-lg)]"
              >
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: bg, color }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="mt-0.5 text-xs" style={{ color: "var(--nx-muted)" }}>
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 rounded-md p-1 transition-colors hover:bg-white/5"
                  style={{ color: "var(--nx-faint)" }}
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/** Fire a toast. No-op safe outside a provider (returns a noop). */
export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? (() => {});
}
