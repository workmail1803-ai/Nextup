"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WorkingTimerProps {
  /** ISO start timestamp of the open session. */
  startISO: string;
  className?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Live HH:MM:SS elapsed since `startISO`, ticking every second. */
export function WorkingTimer({ startISO, className }: WorkingTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = Math.max(0, now - new Date(startISO).getTime());
  const totalSec = Math.floor(elapsedMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return (
    <span
      className={cn("font-mono tabular-nums tracking-tight", className)}
      style={{ color: "var(--nx-text)" }}
      aria-label={`${h} hours ${m} minutes ${s} seconds elapsed`}
    >
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
