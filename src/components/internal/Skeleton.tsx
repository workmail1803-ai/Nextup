import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Shimmering placeholder block. Compose with width/height utilities. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("nx-skeleton", className)} aria-hidden="true" />;
}

/** A card-shaped skeleton for dashboard tiles. */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("nx-card p-5", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}
