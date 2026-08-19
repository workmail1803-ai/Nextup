// =============================================================================
// AvailabilityService — mentor weekly availability slots.
//
// Straddles the auth boundary:
//   * listBookableMentors() — the public /book page, no login → anon client.
//   * everything else — admin availability editing → staff JWT.
// =============================================================================

import { supabase as anonSupabase } from "@/lib/supabase";
import { staffSupabase } from "@/lib/auth/supabase-staff";
import type { AvailabilityInsert, StaffAvailability } from "@/lib/types/scheduling";

const TABLE = "staff_availability";

export interface MentorWithSlots {
  id: string;
  full_name: string;
  title: string | null;
  avatar_url: string | null;
  slots: StaffAvailability[];
}

export const AvailabilityService = {
  /** All slots for one staff member, ordered by weekday then time. */
  async listForStaff(staffId: string): Promise<StaffAvailability[]> {
    const { data, error } = await staffSupabase
      .from(TABLE)
      .select("*")
      .eq("staff_id", staffId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw error;
    return (data ?? []) as StaffAvailability[];
  },

  /**
   * Active mentors with their bookable slots — the public booking page.
   *
   * Reads `public_mentors`, NOT `staff`. The view exposes only id/name/title/
   * avatar; the base table also holds `staff_code`, and row-level security
   * cannot hide a column — anyone could re-select it. Selecting a narrow column
   * list in the query is a client-side promise, not a boundary.
   *
   * Two round-trips stitched in JS rather than one embedded select, because
   * PostgREST cannot embed a related table through a view without a declared
   * foreign key.
   */
  async listBookableMentors(): Promise<MentorWithSlots[]> {
    const [mentorsRes, slotsRes] = await Promise.all([
      anonSupabase
        .from("public_mentors")
        .select("id, full_name, title, avatar_url")
        .order("full_name", { ascending: true }),
      anonSupabase.from(TABLE).select("*").eq("is_active", true),
    ]);
    if (mentorsRes.error) throw mentorsRes.error;
    if (slotsRes.error) throw slotsRes.error;

    const byStaff = new Map<string, StaffAvailability[]>();
    for (const slot of (slotsRes.data ?? []) as StaffAvailability[]) {
      const list = byStaff.get(slot.staff_id);
      if (list) list.push(slot);
      else byStaff.set(slot.staff_id, [slot]);
    }

    return ((mentorsRes.data ?? []) as Omit<MentorWithSlots, "slots">[])
      .map((m) => ({
        ...m,
        slots: (byStaff.get(m.id) ?? []).sort(
          (a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time),
        ),
      }))
      .filter((m) => m.slots.length > 0);
  },

  async add(input: AvailabilityInsert): Promise<StaffAvailability> {
    const { data, error } = await staffSupabase.from(TABLE).insert(input).select().single();
    if (error) throw error;
    return data as StaffAvailability;
  },

  async remove(id: string): Promise<void> {
    const { error } = await staffSupabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * How many booked consultations sit on this window. Zero means it is safe to
   * edit or remove; anything else and the database will refuse (migration 0019),
   * so the UI shows a lock instead of offering a control that will fail.
   */
  async bookingCount(availabilityId: string): Promise<number> {
    const { data, error } = await staffSupabase.rpc("availability_booking_count", {
      p_avail_id: availabilityId,
    });
    if (error) throw error;
    return (data as number) ?? 0;
  },

  /** Booking counts for a whole schedule in one round-trip. */
  async bookingCounts(ids: string[]): Promise<Record<string, number>> {
    const entries = await Promise.all(
      ids.map(async (id) => [id, await AvailabilityService.bookingCount(id)] as const),
    );
    return Object.fromEntries(entries);
  },

  async setActive(id: string, is_active: boolean): Promise<void> {
    const { error } = await staffSupabase.from(TABLE).update({ is_active }).eq("id", id);
    if (error) throw error;
  },
};
