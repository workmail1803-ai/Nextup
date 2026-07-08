import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Centered, on-brand empty state for tables, lists and panels. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "var(--nx-accent-soft)", color: "var(--nx-accent-2)" }}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      )}
      <p className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
        {title}
      </p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm" style={{ color: "var(--nx-faint)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
