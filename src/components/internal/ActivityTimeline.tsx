import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "./StatusBadge";

export interface TimelineItem {
  id: string;
  icon?: LucideIcon;
  title: React.ReactNode;
  meta?: React.ReactNode;
  time?: string;
  tone?: BadgeTone;
}

const DOT: Record<BadgeTone, string> = {
  positive: "var(--nx-positive)",
  warning: "var(--nx-warning)",
  danger: "var(--nx-danger)",
  info: "var(--nx-info)",
  accent: "var(--nx-accent-2)",
  neutral: "var(--nx-faint)",
};

interface Props {
  items: TimelineItem[];
  className?: string;
}

/** Vertical activity feed with a connecting rail and toned nodes. */
export function ActivityTimeline({ items, className }: Props) {
  return (
    <ol className={cn("relative space-y-4", className)}>
      {items.map((item, i) => {
        const tone = item.tone ?? "neutral";
        const Icon = item.icon;
        const isLast = i === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3.5">
            {/* rail */}
            {!isLast && (
              <span
                className="absolute left-[13px] top-7 bottom-[-1rem] w-px"
                style={{ background: "var(--nx-edge)" }}
              />
            )}
            <span
              className="relative z-10 mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
              style={{
                background: "var(--nx-panel-2)",
                border: `1px solid var(--nx-edge-2)`,
                color: DOT[tone],
              }}
            >
              {Icon ? (
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <span className="h-2 w-2 rounded-full" style={{ background: DOT[tone] }} />
              )}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm" style={{ color: "var(--nx-text)" }}>
                  {item.title}
                </p>
                {item.time && (
                  <span className="shrink-0 text-xs" style={{ color: "var(--nx-faint)" }}>
                    {item.time}
                  </span>
                )}
              </div>
              {item.meta && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--nx-muted)" }}>
                  {item.meta}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
