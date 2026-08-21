// =============================================================================
// POST /api/admin/staff — create a staff member WITH a working login.
//
// WHY THIS EXISTS ON THE SERVER
//   Creating a Supabase auth user requires the Admin API and the service-role
//   key, which must never reach the browser. Until now staff rows could be
//   created from the admin panel but no matching login existed, so a new person
//   could be added and still not get in. Every account so far was made by hand.
//
// AUTHORISATION
//   The caller's own JWT is verified first, and is_admin() is asked in the
//   database using THAT token. The service key is only reached after the caller
//   has proved they are an admin — it is never the thing that authorises.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_KEY;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!SERVICE) {
    return bad("SUPABASE_SERVICE_KEY is not configured on the server.", 500);
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return bad("Not signed in.", 401);

  // 1. Who is calling? Ask the database with their own token, not ours.
  const asCaller = createClient(URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: isAdmin, error: roleErr } = await asCaller.rpc("is_admin");
  if (roleErr) return bad("Could not verify your account.", 401);
  if (!isAdmin) return bad("Admins only.", 403);

  // 2. Validate the request.
  let body: {
    full_name?: string; email?: string; password?: string;
    role?: string; title?: string; is_mentor?: boolean; staff_code?: string;
  };
  try {
    body = await req.json();
  } catch {
    return bad("Malformed request.");
  }

  const fullName = (body.full_name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const role = body.role === "admin" ? "admin" : "staff";

  if (fullName.length < 2) return bad("Enter the person's name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Enter a valid email address.");
  // Long enough to matter, short enough to type on a phone without despair.
  if (password.length < 10) return bad("Use a password of at least 10 characters.");

  const admin = createClient(URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. Refuse if that email is already a staff member. Two rows for one person
  //    means claim_staff_account() binds to whichever it finds first.
  const { data: clash } = await admin
    .from("staff").select("id").ilike("email", email).maybeSingle();
  if (clash) return bad("Someone with that email is already on the team.");

  // 4. Create the auth user, pre-confirmed — there is no SMTP configured, so a
  //    confirmation email would never arrive and the account would be unusable.
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  let authUserId = created?.user?.id ?? null;

  if (authErr) {
    // Already has an auth account (e.g. they signed into the student portal
    // with this address). Reuse it rather than failing.
    if (/already been registered|already exists/i.test(authErr.message)) {
      const { data: list } = await admin.auth.admin.listUsers();
      authUserId = list?.users?.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      if (!authUserId) return bad("That email already has an account we cannot reach.");
    } else {
      return bad(authErr.message, 500);
    }
  }

  // 5. The staff row, already bound — so they can sign in immediately rather
  //    than waiting for the claim-by-email step.
  const code = (body.staff_code ?? "").trim() ||
    `NX-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { data: staffRow, error: staffErr } = await admin
    .from("staff")
    .insert({
      full_name: fullName,
      email,
      staff_code: code,
      title: body.title?.trim() || null,
      role,
      is_mentor: !!body.is_mentor,
      status: "active",
      auth_user_id: authUserId,
    })
    .select("id, full_name, email, role, staff_code, is_mentor")
    .single();

  if (staffErr) {
    // Roll back the auth user we just made, or a retry hits "already registered"
    // against an account with no staff row — a dead end for the admin.
    if (created?.user?.id) {
      await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    }
    return bad(staffErr.message, 500);
  }

  return NextResponse.json({ staff: staffRow });
}
