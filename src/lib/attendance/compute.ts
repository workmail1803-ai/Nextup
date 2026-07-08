// =============================================================================
// Attendance — pure computation layer.
//
// Every function here is pure and synchronous (no I/O, no Supabase). All hours
// math, formatting, and roll-ups live here so the UI and the future admin
// reports share one source of truth. Mirrors the eligibility/evaluate.ts pattern.
// =============================================================================

import type {
  AttendanceSession,
  AttendanceSummary,
} from "@/lib/types/attendance";

// -----------------------------------------------------------------------------
// Dates (all local-time — the business runs on one local calendar)
// -----------------------------------------------------------------------------

/** Local `YYYY-MM-DD` for a Date (defaults to now). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday-based start of the week containing `d`, at local midnight. */
export function startOfWeek(d: Date = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Mon = 0 … Sun = 6
  x.setDate(x.getDate() - dow);
  return x;
}

export function startOfMonth(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Business days (Mon–Fri) from the 1st of the month through `d` inclusive. */
export function businessDaysElapsed(d: Date = new Date()): number {
  let count = 0;
  const cur = startOfMonth(d);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// -----------------------------------------------------------------------------
// Duration
// -----------------------------------------------------------------------------

/** Whole minutes between two ISO timestamps (never negative). */
export function computeDurationMinutes(startISO: string, endISO: string): number {
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

/** Live elapsed minutes for an open session, relative to `now`. */
export function elapsedMinutes(startISO: string, now: Date = new Date()): number {
  return Math.max(0, Math.round((now.getTime() - new Date(startISO).getTime()) / 60000));
}

/** Minutes credited to a session — persisted value, else live-derived. */
export function sessionMinutes(s: AttendanceSession, now: Date = new Date()): number {
  if (s.duration_minutes != null) return s.duration_minutes;
  if (s.end_at) return computeDurationMinutes(s.start_at, s.end_at);
  return elapsedMinutes(s.start_at, now);
}

// -----------------------------------------------------------------------------
// Formatting
// -----------------------------------------------------------------------------

/** `"2h 05m"`, `"45m"`, `"0m"`. */
export function formatHm(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}m`;
  return `${h}h ${String(mm).padStart(2, "0")}m`;
}

/** Decimal hours, e.g. 150 → 2.5. */
export function hoursDecimal(minutes: number, dp = 1): number {
  return Number((minutes / 60).toFixed(dp));
}

/** `"09:30"` local clock time for an ISO timestamp. */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// -----------------------------------------------------------------------------
// Roll-ups
// -----------------------------------------------------------------------------

/**
 * Summarise a staff member's sessions into today/week/month/all-time totals
 * plus an attendance rate. `now` is injectable for deterministic tests.
 */
export function summarize(
  sessions: AttendanceSession[],
  now: Date = new Date(),
): AttendanceSummary {
  const todayKey = localDateKey(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  let todayMinutes = 0;
  let weekMinutes = 0;
  let monthMinutes = 0;
  let allTimeMinutes = 0;
  let longestSessionMinutes = 0;
  const monthDays = new Set<string>();

  for (const s of sessions) {
    const mins = sessionMinutes(s, now);
    allTimeMinutes += mins;
    if (s.status === "completed") {
      longestSessionMinutes = Math.max(longestSessionMinutes, mins);
    }

    const day = new Date(s.start_at);
    if (s.work_date === todayKey) todayMinutes += mins;
    if (day >= weekStart) weekMinutes += mins;
    if (day >= monthStart) {
      monthMinutes += mins;
      monthDays.add(s.work_date);
    }
  }

  const elapsed = businessDaysElapsed(now);
  const daysPresentThisMonth = monthDays.size;
  const attendanceRatePct =
    elapsed > 0 ? Math.min(100, Math.round((daysPresentThisMonth / elapsed) * 100)) : 0;

  return {
    todayMinutes,
    weekMinutes,
    monthMinutes,
    allTimeMinutes,
    daysPresentThisMonth,
    businessDaysElapsed: elapsed,
    attendanceRatePct,
    longestSessionMinutes,
  };
}

/**
 * Total minutes per local day for the last `days` days ending today.
 * Returns oldest→newest, one point per day (0 when absent) — feeds the chart.
 */
export function dailyTotals(
  sessions: AttendanceSession[],
  days = 14,
  now: Date = new Date(),
): { date: string; label: string; minutes: number }[] {
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    byDay.set(s.work_date, (byDay.get(s.work_date) ?? 0) + sessionMinutes(s, now));
  }

  const out: { date: string; label: string; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = localDateKey(d);
    out.push({
      date: key,
      label: d.toLocaleDateString([], { weekday: "short" }),
      minutes: byDay.get(key) ?? 0,
    });
  }
  return out;
}
