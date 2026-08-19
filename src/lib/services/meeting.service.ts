// =============================================================================
// MeetingService — client meetings (each = one mentor at one time).
// =============================================================================

// Every query here is staff-only, so it must carry the signed-in staff JWT —
// the anon client would run as role `anon` and is_staff()/is_admin() would
// see nobody. Aliased so the body of this module reads unchanged.
import { staffSupabase as supabase } from "@/lib/auth/supabase-staff";
import type {
  ClientMeeting,
  MeetingInsert,
  MeetingUpdate,
} from "@/lib/types/client";

const TABLE = "client_meetings";

export interface MeetingWithNames extends ClientMeeting {
  consultant: { id: string; full_name: string } | null;
  forwarded_by?: { id: string; full_name: string } | null;
  client?: { id: string; full_name: string } | null;
}

export const MeetingService = {
  /** Meetings for one client, newest first, with the consultant name. */
  async listForClient(clientId: string): Promise<MeetingWithNames[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(
        "*, consultant:staff!client_meetings_consultant_id_fkey(id,full_name), forwarded_by:staff!client_meetings_forwarded_by_staff_id_fkey(id,full_name)",
      )
      .eq("client_id", clientId)
      .order("scheduled_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as unknown as MeetingWithNames[];
  },

  /** Upcoming meetings across all clients (admin agenda / consultant board). */
  async upcoming(limit = 50): Promise<MeetingWithNames[]> {
    const nowISO = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .select(
        "*, consultant:staff!client_meetings_consultant_id_fkey(id,full_name), client:clients(id,full_name)",
      )
      .gte("scheduled_at", nowISO)
      .order("scheduled_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as MeetingWithNames[];
  },

  async create(input: MeetingInsert): Promise<ClientMeeting> {
    const { data, error } = await supabase.from(TABLE).insert(input).select().single();
    if (error) throw error;
    return data as ClientMeeting;
  },

  async update(id: string, patch: MeetingUpdate): Promise<ClientMeeting> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ClientMeeting;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },
};

// -----------------------------------------------------------------------------
// A mentor's own consultation diary. Server-side join (migration 0019) rather
// than three round-trips stitched in the browser.
// -----------------------------------------------------------------------------

export interface MentorMeeting {
  appointment_id: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  client_whatsapp: string | null;
  client_stage: string | null;
  countries: string[] | null;
  scheduled_at: string;
  status: string;
}

export const MentorScheduleService = {
  /** Upcoming consultations assigned to the signed-in mentor. */
  async upcoming(daysAhead = 30): Promise<MentorMeeting[]> {
    const { data, error } = await supabase.rpc("mentor_upcoming_meetings", {
      p_days_ahead: daysAhead,
    });
    if (error) throw error;
    return (data as MentorMeeting[]) ?? [];
  },
};
