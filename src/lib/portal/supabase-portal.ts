// =============================================================================
// Portal-scoped Supabase client. Kept SEPARATE from the staff `supabase` client
// so a signed-in student's auth session never attaches to staff requests. This
// client carries the student's JWT, so its reads run as the `authenticated`
// role and are governed by the portal RLS policies (migration 0008).
// =============================================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const portalSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Distinct storage key so the portal session is isolated from any other
    // Supabase client in the same browser.
    storageKey: "nx_portal_auth",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
