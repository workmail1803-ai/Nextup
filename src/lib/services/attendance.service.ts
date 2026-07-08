// =============================================================================
// AttendanceService — Start/End Work + history + realtime for one staff member
// (and a today-wide read the admin will reuse in Phase 2).
// =============================================================================

import { supabase } from "@/lib/supabase";
import type { AttendanceSession } from "@/lib/types/attendance";
import { computeDurationMinutes, localDateKey } from "@/lib/attendance/compute";

const TABLE = "attendance_sessions";

export const AttendanceService = {
  /** The staff member's currently-open session, if any. */
  async getActiveSession(staffId: string): Promise<AttendanceSession | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("staff_id", staffId)
      .eq("status", "working")
      .maybeSingle();
    if (error) throw error;
    return (data as AttendanceSession) ?? null;
  },

  /**
   * Start Work. Idempotent-ish: if a session is already open, return it rather
   * than tripping the one-open-per-staff unique index.
   */
  async startWork(staffId: string): Promise<AttendanceSession> {
    const existing = await AttendanceService.getActiveSession(staffId);
    if (existing) return existing;

    const nowISO = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        staff_id: staffId,
        work_date: localDateKey(),
        start_at: nowISO,
        status: "working",
      })
      .select()
      .single();
    if (error) throw error;
    return data as AttendanceSession;
  },

  /** End Work — persists end time, computed duration, status = completed. */
  async endWork(session: AttendanceSession): Promise<AttendanceSession> {
    const endISO = new Date().toISOString();
    const duration = computeDurationMinutes(session.start_at, endISO);
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        end_at: endISO,
        status: "completed",
        duration_minutes: duration,
      })
      .eq("id", session.id)
      .select()
      .single();
    if (error) throw error;
    return data as AttendanceSession;
  },

  /** Recent sessions for one staff member (newest first). */
  async historyForStaff(staffId: string, limit = 120): Promise<AttendanceSession[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("staff_id", staffId)
      .order("work_date", { ascending: false })
      .order("start_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AttendanceSession[];
  },

  /** Every session for today, across all staff — admin live board (Phase 2). */
  async todayAll(): Promise<AttendanceSession[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("work_date", localDateKey())
      .order("start_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AttendanceSession[];
  },

  /**
   * Subscribe to realtime changes for one staff member's sessions. Returns an
   * unsubscribe function. `onChange` fires on any insert/update/delete.
   */
  subscribeStaff(staffId: string, onChange: () => void): () => void {
    const channel = supabase
      .channel(`attendance:${staffId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLE,
          filter: `staff_id=eq.${staffId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /** Subscribe to ALL attendance changes (admin board). Returns unsubscribe. */
  subscribeAll(onChange: () => void): () => void {
    const channel = supabase
      .channel("attendance:all")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => onChange())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
