// =============================================================================
// AppointmentService — public free-appointment bookings (no login) + the
// staff/admin queue. Phone numbers are stored normalized (digits) and unique.
// =============================================================================

// This service straddles the auth boundary:
//   * create()  — the public /book page, no login. Must stay on the anon client.
//   * everything else — the staff queue, needs the staff JWT for is_staff().
import { supabase as anonSupabase } from "@/lib/supabase";
import { staffSupabase } from "@/lib/auth/supabase-staff";
import {
  normalizePhone,
  type Appointment,
  type AppointmentInsert,
  type AppointmentStatus,
  type AppointmentWithMentors,
} from "@/lib/types/scheduling";

const TABLE = "appointments";
const WITH_MENTORS =
  "*, preferred_mentor:staff!appointments_preferred_mentor_id_fkey(id,full_name)," +
  " assigned_mentor:staff!appointments_assigned_mentor_id_fkey(id,full_name)";

/** Thrown when the phone number is already booked. */
export class DuplicatePhoneError extends Error {
  constructor() {
    super("DUPLICATE_PHONE");
    this.name = "DuplicatePhoneError";
  }
}

export const AppointmentService = {
  /**
   * Public booking. Returns nothing on purpose.
   *
   * `.select()` after the insert issues a RETURNING, which needs SELECT
   * permission. Anon may INSERT here and deliberately may not SELECT — a
   * visitor must not be able to read the booking queue. Asking for the row back
   * therefore failed the entire booking with an RLS error, which the form
   * reported as "something went wrong, try again in a moment".
   */
  async create(input: AppointmentInsert): Promise<void> {
    const phone = normalizePhone(input.phone);
    if (!phone) throw new Error("INVALID_PHONE");

    // Via RPC, not a SELECT: after migration 0012 anon may INSERT appointments
    // but never read them, so a visitor cannot enumerate the booking queue.
    // phone_already_booked() is SECURITY DEFINER and returns only a boolean.
    const { data: existing, error: checkErr } = await anonSupabase.rpc(
      "phone_already_booked",
      { p_phone: phone },
    );
    if (checkErr) throw checkErr;
    if (existing) throw new DuplicatePhoneError();

    const status: AppointmentStatus = input.preferred_mentor_id ? "assigned" : "pending";
    const { error } = await anonSupabase.from(TABLE).insert({
      ...input,
      phone,
      assigned_mentor_id: input.preferred_mentor_id ?? null,
      status,
    });
    if (error) {
      // Unique-violation race → same friendly error.
      if ((error as { code?: string }).code === "23505") throw new DuplicatePhoneError();
      throw error;
    }
  },

  /** Full queue for staff/admin, newest first. */
  async list(): Promise<AppointmentWithMentors[]> {
    const { data, error } = await staffSupabase
      .from(TABLE)
      .select(WITH_MENTORS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as AppointmentWithMentors[];
  },

  /** Appointments assigned to (or in the pool awaiting) a given mentor. */
  async listForMentor(staffId: string): Promise<AppointmentWithMentors[]> {
    const { data, error } = await staffSupabase
      .from(TABLE)
      .select(WITH_MENTORS)
      .or(`assigned_mentor_id.eq.${staffId},and(assigned_mentor_id.is.null,preferred_mentor_id.is.null)`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as AppointmentWithMentors[];
  },

  async assign(id: string, mentorId: string | null): Promise<void> {
    const { error } = await staffSupabase
      .from(TABLE)
      .update({ assigned_mentor_id: mentorId, status: mentorId ? "assigned" : "pending" })
      .eq("id", id);
    if (error) throw error;
  },

  async update(
    id: string,
    patch: Partial<Pick<Appointment, "status" | "scheduled_at" | "notes" | "assigned_mentor_id">>,
  ): Promise<void> {
    const { error } = await staffSupabase.from(TABLE).update(patch).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await staffSupabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  subscribe(onChange: () => void): () => void {
    const channel = staffSupabase
      .channel("appointments-all")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => onChange())
      .subscribe();
    return () => {
      staffSupabase.removeChannel(channel);
    };
  },
};
