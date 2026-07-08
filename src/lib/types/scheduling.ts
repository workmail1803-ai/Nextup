// =============================================================================
// Scheduling domain types — staff_availability + appointments (migration 0006).
// weekday: 0 = Sunday … 6 = Saturday (JS Date.getDay convention).
// =============================================================================

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_LONG = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export type AppointmentStatus =
  | "pending"
  | "assigned"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface StaffAvailability {
  id: string;
  staff_id: string;
  weekday: number;
  start_time: string; // "17:00:00"
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AvailabilityInsert = {
  staff_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
};

export interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  interest: string | null;
  preferred_mentor_id: string | null;
  assigned_mentor_id: string | null;
  weekday: number | null;
  slot_start: string | null;
  slot_end: string | null;
  scheduled_at: string | null;
  status: AppointmentStatus;
  notes: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithMentors extends Appointment {
  preferred_mentor: { id: string; full_name: string } | null;
  assigned_mentor: { id: string; full_name: string } | null;
}

/** Public booking payload (no login). */
export type AppointmentInsert = {
  name: string;
  phone: string;
  email?: string | null;
  interest?: string | null;
  preferred_mentor_id?: string | null;
  weekday?: number | null;
  slot_start?: string | null;
  slot_end?: string | null;
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** "17:00:00" | "17:00" → "5:00 PM". */
export function formatTime(t: string | null | undefined): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatSlot(start: string | null, end: string | null): string {
  if (!start) return "";
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/** Normalize a phone number to digits only (for uniqueness comparison). */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

export const APPOINTMENT_STATUS_META: Record<
  AppointmentStatus,
  { label: string }
> = {
  pending: { label: "Pending" },
  assigned: { label: "Assigned" },
  confirmed: { label: "Confirmed" },
  completed: { label: "Completed" },
  cancelled: { label: "Cancelled" },
};
