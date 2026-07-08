import { cn } from "@/lib/utils";

export type BadgeTone =
  | "positive"
  | "warning"
  | "danger"
  | "info"
  | "accent"
  | "neutral";

const TONE_VARS: Record<BadgeTone, { fg: string; bg: string; bd: string }> = {
  positive: { fg: "var(--nx-positive)", bg: "var(--nx-positive-soft)", bd: "rgba(70,177,125,0.3)" },
  warning: { fg: "var(--nx-warning)", bg: "var(--nx-warning-soft)", bd: "rgba(224,178,58,0.3)" },
  danger: { fg: "var(--nx-danger)", bg: "var(--nx-danger-soft)", bd: "rgba(239,107,94,0.3)" },
  info: { fg: "var(--nx-info)", bg: "var(--nx-info-soft)", bd: "rgba(90,169,224,0.3)" },
  accent: { fg: "var(--nx-accent-2)", bg: "var(--nx-accent-soft)", bd: "var(--nx-accent-line)" },
  neutral: { fg: "var(--nx-muted)", bg: "var(--nx-panel-2)", bd: "var(--nx-edge-2)" },
};

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

/** Pill status badge with an optional (optionally pulsing) leading dot. */
export function StatusBadge({
  label,
  tone = "neutral",
  dot = false,
  pulse = false,
  className,
}: StatusBadgeProps) {
  const t = TONE_VARS[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      )}
      style={{ color: t.fg, background: t.bg, border: `1px solid ${t.bd}` }}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", pulse && "nx-pulse")}
          style={{ background: t.fg }}
        />
      )}
      {label}
    </span>
  );
}
