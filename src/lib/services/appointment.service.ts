// =============================================================================
// AppointmentService — public free-appointment bookings (no login) + the
// staff/admin queue. Phone numbers are stored normalized (digits) and unique.
// =============================================================================

import { supabase } from "@/lib/supabase";
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
  /** Public booking. Enforces a unique phone with a friendly error. */
  async create(input: AppointmentInsert): Promise<Appointment> {
    const phone = normalizePhone(input.phone);
    if (!phone) throw new Error("INVALID_PHONE");

    const { data: existing, error: checkErr } = await supabase
      .from(TABLE)
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (checkErr) throw checkErr;
    if (existing) throw new DuplicatePhoneError();

    const status: AppointmentStatus = input.preferred_mentor_id ? "assigned" : "pending";
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        ...input,
        phone,
        assigned_mentor_id: input.preferred_mentor_id ?? null,
        status,
      })
      .select()
      .single();
    if (error) {
      // Unique-violation race → same friendly error.
      if ((error as { code?: string }).code === "23505") throw new DuplicatePhoneError();
      throw error;
    }
    return data as Appointment;
  },

  /** Full queue for staff/admin, newest first. */
  async list(): Promise<AppointmentWithMentors[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(WITH_MENTORS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as AppointmentWithMentors[];
  },

  /** Appointments assigned to (or in the pool awaiting) a given mentor. */
  async listForMentor(staffId: string): Promise<AppointmentWithMentors[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(WITH_MENTORS)
      .or(`assigned_mentor_id.eq.${staffId},and(assigned_mentor_id.is.null,preferred_mentor_id.is.null)`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as AppointmentWithMentors[];
  },

  async assign(id: string, mentorId: string | null): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ assigned_mentor_id: mentorId, status: mentorId ? "assigned" : "pending" })
      .eq("id", id);
    if (error) throw error;
  },

  async update(
    id: string,
    patch: Partial<Pick<Appointment, "status" | "scheduled_at" | "notes" | "assigned_mentor_id">>,
  ): Promise<void> {
    const { error } = await supabase.from(TABLE).update(patch).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  subscribe(onChange: () => void): () => void {
    const channel = supabase
      .channel("appointments-all")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => onChange())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
