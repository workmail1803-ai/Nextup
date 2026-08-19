// =============================================================================
// Staff domain types — mirror the `staff` table (see supabase/migrations/0001).
// =============================================================================

export type StaffStatus = "active" | "disabled";

/** Mirrors the `staff_role` enum (migration 0010). Admin is a superset of staff. */
export type StaffRole = "admin" | "staff";

export interface Staff {
  id: string;
  full_name: string;
  staff_code: string;
  title: string | null;
  avatar_url: string | null;
  status: StaffStatus;
  /** Drives every permission check; enforced in RLS via is_admin()/is_staff(). */
  role: StaffRole;
  /** Sign-in identity. Null until an admin assigns one. */
  email: string | null;
  /** Bound on first sign-in by claim_staff_account(). Null = never signed in. */
  auth_user_id: string | null;
  /**
   * Whether this person takes student consultations. Deliberately separate from
   * `role`: an admin may mentor, and a staff member handling documents may not.
   * Only mentors appear in the student-facing list and have bookable slots.
   */
  is_mentor: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Fields settable on create (server fills id/timestamps/last_login). */
export type StaffInsert = {
  full_name: string;
  staff_code: string;
  title?: string | null;
  avatar_url?: string | null;
  status?: StaffStatus;
  role?: StaffRole;
  email?: string | null;
  is_mentor?: boolean;
};

export type StaffUpdate = Partial<StaffInsert>;
