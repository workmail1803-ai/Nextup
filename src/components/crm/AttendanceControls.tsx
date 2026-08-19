"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, LoaderCircle, Play, Square } from "lucide-react";
import type { AttendanceSession } from "@/lib/types/attendance";
import { WorkingTimer, ConfirmDialog } from "@/components/internal";
import { clockTime, formatHm } from "@/lib/attendance/compute";

interface Props {
  active: AttendanceSession | null;
  todayMinutes: number;
  starting: boolean;
  ending: boolean;
  onStart: () => void;
  onEnd: () => void;
}

/** The primary WFH clock: one card, two actions (Start Work / End Work). */
export function AttendanceControls({
  active,
  todayMinutes,
  starting,
  ending,
  onStart,
  onEnd,
}: Props) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const working = !!active;

  return (
    <div className="nx-card relative overflow-hidden p-6 sm:p-7">
      {/* ambient accent glow while working */}
      {working && (
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "var(--nx-positive-soft)" }}
        />
      )}

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={working ? "nx-pulse" : ""}
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: working ? "var(--nx-positive)" : "var(--nx-faint)",
              display: "inline-block",
            }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: working ? "var(--nx-positive)" : "var(--nx-faint)" }}
          >
            {working ? "Working now" : "Off the clock"}
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--nx-faint)" }}>
          {new Date().toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="relative mt-6 flex flex-col items-center py-4 text-center">
        {working ? (
          <>
            <motion.div
              key="timer"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-5xl font-semibold sm:text-6xl"
            >
              <WorkingTimer startISO={active!.start_at} />
            </motion.div>
            <p className="mt-3 text-sm" style={{ color: "var(--nx-muted)" }}>
              Started at {clockTime(active!.start_at)}
            </p>
          </>
        ) : (
          <>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: todayMinutes > 0 ? "var(--nx-positive-soft)" : "var(--nx-accent-soft)",
                color: todayMinutes > 0 ? "var(--nx-positive)" : "var(--nx-accent-2)",
              }}
            >
              {todayMinutes > 0 ? (
                <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
              ) : (
                <Play className="h-7 w-7" strokeWidth={1.75} />
              )}
            </div>
            <p className="mt-4 text-lg font-semibold" style={{ color: "var(--nx-text)" }}>
              {todayMinutes > 0
                ? `You've logged ${formatHm(todayMinutes)} today`
                : "Ready to start your day?"}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--nx-muted)" }}>
              {todayMinutes > 0
                ? "Start another session any time."
                : "Clock in to begin tracking your working hours."}
            </p>
          </>
        )}
      </div>

      <div className="relative mt-4">
        {working ? (
          <button
            className="nx-btn nx-btn-danger w-full py-3.5 text-[0.95rem]"
            onClick={() => setConfirmEnd(true)}
            disabled={ending}
          >
            {ending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Ending…
              </>
            ) : (
              <>
                <Square className="h-4 w-4" /> End Work
              </>
            )}
          </button>
        ) : (
          <button
            className="nx-btn nx-btn-primary w-full py-3.5 text-[0.95rem]"
            onClick={onStart}
            disabled={starting}
          >
            {starting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Starting…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start Work
              </>
            )}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="End your work session?"
        description={
          active ? (
            <>
              You started at <strong>{clockTime(active.start_at)}</strong>. We&apos;ll
              record your total hours for today.
            </>
          ) : null
        }
        confirmLabel="End Work"
        tone="danger"
        busy={ending}
        onConfirm={() => {
          setConfirmEnd(false);
          onEnd();
        }}
        onCancel={() => setConfirmEnd(false)}
      />
    </div>
  );
}
