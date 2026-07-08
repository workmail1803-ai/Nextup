// =============================================================================
// StaffService — all reads/writes for the `staff` table, behind one module.
// Reuses the shared `supabase` client (no second backend).
// =============================================================================

import { supabase } from "@/lib/supabase";
import type { Staff, StaffInsert, StaffUpdate } from "@/lib/types/staff";

const TABLE = "staff";

export const StaffService = {
  /** All staff, alphabetical — used by the admin table (Phase 2). */
  async list(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("full_name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Staff[];
  },

  /** Look up an active staff member by code (case-insensitive). Login path. */
  async getByCode(code: string): Promise<Staff | null> {
    const trimmed = code.trim();
    if (!trimmed) return null;
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .ilike("staff_code", trimmed) // exact, case-insensitive (no wildcards)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    return (data as Staff) ?? null;
  },

  async getById(id: string): Promise<Staff | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Staff) ?? null;
  },

  async create(input: StaffInsert): Promise<Staff> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as Staff;
  },

  async update(id: string, patch: StaffUpdate): Promise<Staff> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Staff;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  /** Stamp last_login_at = now. Best-effort; never blocks login. */
  async touchLogin(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};

/**
 * Generate a human-friendly, unlikely-to-collide staff code, e.g. `NX-7K2Q`.
 * Pure — the admin UI (Phase 2) verifies uniqueness against the DB.
 */
export function generateStaffCode(prefix = "NX"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  let body = "";
  for (let i = 0; i < 4; i++) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${body}`;
}
