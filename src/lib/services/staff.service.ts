// =============================================================================
// StaffService — all reads/writes for the `staff` table, behind one module.
// Reuses the shared `supabase` client (no second backend).
// =============================================================================

// Every query here is staff-only, so it must carry the signed-in staff JWT —
// the anon client would run as role `anon` and is_staff()/is_admin() would
// see nobody. Aliased so the body of this module reads unchanged.
import { staffSupabase as supabase } from "@/lib/auth/supabase-staff";
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

// -----------------------------------------------------------------------------
// Profile photos
//
// The bucket is PUBLIC on purpose: a mentor's photo appears on the anonymous
// /book page, so a signed URL would be a slower public URL with extra steps.
// Writes are still restricted to the owner (migration 0023).
// -----------------------------------------------------------------------------

const AVATAR_BUCKET = "staff-avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // matches the bucket limit
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

export const StaffAvatarService = {
  /**
   * Upload (or replace) the signed-in staff member's photo and record the URL.
   * A fixed filename per person means replacing does not leave the old file
   * behind in a bucket nobody ever tidies.
   */
  async upload(staffId: string, file: File): Promise<string> {
    if (file.size > AVATAR_MAX_BYTES) {
      throw new Error("That image is over 2 MB. A normal phone photo is fine.");
    }
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${staffId}/avatar.${ext || "jpg"}`;

    const { error: upErr } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;

    // Cache-bust: the path is stable, so browsers would keep showing the old
    // image after a replacement without this.
    const base = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
    const url = `${base}?v=${Date.now()}`;

    const { error: rpcErr } = await supabase.rpc("staff_set_avatar", { p_url: url });
    if (rpcErr) throw rpcErr;
    return url;
  },

  /** Clear the photo, falling back to initials. */
  async remove(staffId: string, currentUrl: string | null): Promise<void> {
    if (currentUrl) {
      const path = currentUrl.split(`/${AVATAR_BUCKET}/`)[1]?.split("?")[0];
      if (path) await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    }
    const { error } = await supabase.rpc("staff_set_avatar", { p_url: null });
    if (error) throw error;
  },
};
