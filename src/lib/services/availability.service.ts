// =============================================================================
// AvailabilityService — mentor weekly availability slots.
// =============================================================================

import { supabase } from "@/lib/supabase";
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
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("staff_id", staffId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw error;
    return (data ?? []) as StaffAvailability[];
  },

  /**
   * Active mentors (staff who have at least one active slot) with their slots —
   * used by the public booking page. Selects only public-safe columns.
   */
  async listBookableMentors(): Promise<MentorWithSlots[]> {
    const { data, error } = await supabase
      .from("staff")
      .select("id, full_name, title, avatar_url, staff_availability(*)")
      .eq("status", "active")
      .order("full_name", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as unknown as (MentorWithSlots & { staff_availability: StaffAvailability[] })[])
      .map((m) => {
        const slots = (m.staff_availability ?? [])
          .filter((s) => s.is_active)
          .sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));
        return { id: m.id, full_name: m.full_name, title: m.title, avatar_url: m.avatar_url, slots };
      })
      .filter((m) => m.slots.length > 0);
  },

  async add(input: AvailabilityInsert): Promise<StaffAvailability> {
    const { data, error } = await supabase.from(TABLE).insert(input).select().single();
    if (error) throw error;
    return data as StaffAvailability;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  async setActive(id: string, is_active: boolean): Promise<void> {
    const { error } = await supabase.from(TABLE).update({ is_active }).eq("id", id);
    if (error) throw error;
  },
};
