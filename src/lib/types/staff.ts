// =============================================================================
// Staff domain types — mirror the `staff` table (see supabase/migrations/0001).
// =============================================================================

export type StaffStatus = "active" | "disabled";

export interface Staff {
  id: string;
  full_name: string;
  staff_code: string;
  title: string | null;
  avatar_url: string | null;
  status: StaffStatus;
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
};

export type StaffUpdate = Partial<StaffInsert>;
