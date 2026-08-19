// =============================================================================
// Staff-scoped Supabase client.
//
// Kept SEPARATE from both the legacy anon `supabase` client and the student
// `portalSupabase` client, for two reasons:
//
//   1. Isolation — a staff member and a student may share a browser (a mentor
//      demoing the portal on their own laptop). Distinct storage keys mean one
//      session can never be mistaken for the other, and signing out of one does
//      not sign out of the other.
//   2. detectSessionInUrl is OFF here. The student portal uses OAuth/magic-link
//      redirects that drop tokens in the URL fragment; if this client also
//      parsed them it would race the portal client for the same token and one
//      of the two would lose.
// =============================================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const staffSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "nx_staff_auth",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

/** Domain that bare usernames are expanded against. */
export const STAFF_EMAIL_DOMAIN = "nextupmentor.com";

/**
 * Accept either a username or a full email at the login box.
 *
 *   "admin"              -> "admin@nextupmentor.com"
 *   "avijit@gmail.com"   -> unchanged
 *
 * The mapping is a pure convention rather than a lookup, so no email address
 * has to ship in the client bundle and no endpoint exists to enumerate staff.
 */
export function resolveIdentifier(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.includes("@") ? trimmed : `${trimmed}@${STAFF_EMAIL_DOMAIN}`;
}
