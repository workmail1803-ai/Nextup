import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  /** Signed percentage change; renders a colored trend pill when provided. */
  trend?: number | null;
  /** Higher-is-good (default) flips the color meaning of the trend sign. */
  trendGoodWhenUp?: boolean;
  accent?: boolean;
  className?: string;
}

/** Executive KPI card — icon, big value, optional trend + hint. */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  trendGoodWhenUp = true,
  accent = false,
  className,
}: StatCardProps) {
  const hasTrend = typeof trend === "number" && Number.isFinite(trend);
  const up = (trend ?? 0) >= 0;
  const good = up === trendGoodWhenUp;
  const trendColor = good ? "var(--nx-positive)" : "var(--nx-danger)";
  const trendBg = good ? "var(--nx-positive-soft)" : "var(--nx-danger-soft)";

  return (
    <div
      className={cn("nx-card nx-card-hover relative overflow-hidden p-5", className)}
      style={accent ? { boxShadow: "var(--nx-glow)" } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium" style={{ color: "var(--nx-faint)" }}>
          {label}
        </p>
        {Icon && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--nx-accent-soft)", color: "var(--nx-accent-2)" }}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <div className="text-2xl font-semibold tracking-tight" style={{ color: "var(--nx-text)" }}>
          {value}
        </div>
        {hasTrend && (
          <span
            className="mb-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold"
            style={{ color: trendColor, background: trendBg }}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend as number).toFixed(1)}%
          </span>
        )}
      </div>

      {hint && (
        <p className="mt-1.5 text-xs" style={{ color: "var(--nx-faint)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
