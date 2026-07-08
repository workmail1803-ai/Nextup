// =============================================================================
// Attendance domain types — mirror `attendance_sessions` (migration 0001).
// =============================================================================

export type AttendanceStatus = "working" | "completed";

export interface AttendanceSession {
  id: string;
  staff_id: string;
  /** Local work day, `YYYY-MM-DD`. */
  work_date: string;
  /** ISO timestamp when Start Work was pressed. */
  start_at: string;
  /** ISO timestamp when End Work was pressed; null while working. */
  end_at: string | null;
  status: AttendanceStatus;
  /** Persisted on End Work. */
  duration_minutes: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** Rolled-up hours for a set of sessions (all derived, never stored). */
export interface AttendanceSummary {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  allTimeMinutes: number;
  /** Distinct days with a session this month. */
  daysPresentThisMonth: number;
  /** Business days elapsed so far this month (Mon–Fri). */
  businessDaysElapsed: number;
  /** 0–100, present days / business days elapsed. */
  attendanceRatePct: number;
  /** Longest single completed session, minutes. */
  longestSessionMinutes: number;
}
