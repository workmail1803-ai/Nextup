#!/usr/bin/env node
// Make sure the `admin` account in .env.local actually exists and works.
//
// WHY THIS FILE EXISTS
// ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD sat in .env.local for months
// while nothing in the codebase read them. The account they described had been
// created by hand once and then deleted from the staff screen — and because no
// code owned it, nothing noticed and nothing could put it back. Signing in as
// `admin` just returned "Invalid login credentials" forever.
//
// Configuration that nothing enforces is a note-to-self, not configuration.
// This script makes those three variables true:
//
//   node scripts/ensure-admin.mjs
//
// Idempotent. Run it any time the admin login stops working. It creates the
// auth user if missing, resets the password to ADMIN_PASSWORD either way,
// creates or repairs the staff row, and links the two.
//
// It never deletes anything and never touches another account.

import { readFileSync } from "node:fs";

const envFile = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const env = { ...envFile, ...process.env };

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_KEY;
const EMAIL = (env.ADMIN_EMAIL || "").toLowerCase();
const PASSWORD = env.ADMIN_PASSWORD;
const NAME = env.ADMIN_FULL_NAME || "Administrator";

for (const [k, v] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: URL_,
  SUPABASE_SERVICE_KEY: SERVICE,
  ADMIN_EMAIL: EMAIL,
  ADMIN_PASSWORD: PASSWORD,
})) {
  if (!v) {
    console.error(`${k} is not set in .env.local`);
    process.exit(1);
  }
}

const H = {
  Authorization: `Bearer ${SERVICE}`,
  apikey: SERVICE,
  "Content-Type": "application/json",
};

async function api(path, init = {}) {
  const res = await fetch(URL_ + path, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path} -> ${res.status} ${text.slice(0, 400)}`);
  return body;
}

// --- 1. the auth user -------------------------------------------------------
// Paginated rather than a single big page: the project already has 50+ users
// and a missed page would look exactly like a missing account.
let authUser = null;
for (let page = 1; page <= 20 && !authUser; page++) {
  const { users } = await api(`/auth/v1/admin/users?page=${page}&per_page=200`);
  if (!users?.length) break;
  authUser = users.find((u) => (u.email || "").toLowerCase() === EMAIL) || null;
}

if (authUser) {
  await api(`/auth/v1/admin/users/${authUser.id}`, {
    method: "PUT",
    body: JSON.stringify({ password: PASSWORD, email_confirm: true }),
  });
  console.log(`auth user   : existed, password reset  (${EMAIL})`);
} else {
  authUser = await api("/auth/v1/admin/users", {
    method: "POST",
    // Confirmed immediately — there is no inbox behind an internal address
    // like admin@nextupmentor.com, so waiting for a click would never resolve.
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true }),
  });
  console.log(`auth user   : CREATED                  (${EMAIL})`);
}

// --- 2. the staff row -------------------------------------------------------
// Being in auth.users is not enough. The gate looks for an active staff row
// carrying this email; without one a correct password signs in and then lands
// on "no staff record", which looks identical to a wrong password.
const existing = await api(
  `/rest/v1/staff?select=id,role,status,auth_user_id,full_name&email=ilike.${encodeURIComponent(EMAIL)}`,
);

if (existing.length) {
  const row = existing[0];
  const fix = {};
  if (row.role !== "admin") fix.role = "admin";
  if (row.status !== "active") fix.status = "active";
  if (row.auth_user_id !== authUser.id) fix.auth_user_id = authUser.id;

  if (Object.keys(fix).length) {
    await api(`/rest/v1/staff?id=eq.${row.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(fix),
    });
    console.log(`staff row   : repaired ${JSON.stringify(fix)}`);
  } else {
    console.log("staff row   : already correct");
  }
} else {
  const code = `NX-${Math.abs([...EMAIL].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7))
    .toString(36)
    .toUpperCase()
    .slice(0, 4)}`;
  await api("/rest/v1/staff", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      full_name: NAME,
      email: EMAIL,
      role: "admin",
      status: "active",
      title: "Administrator",
      staff_code: code,
      auth_user_id: authUser.id,
      is_mentor: false,
    }),
  });
  console.log(`staff row   : CREATED  (role=admin, code=${code})`);
}

// --- 3. prove it, rather than assume it -------------------------------------
// A blocked or half-finished write does not always announce itself. The only
// honest confirmation is signing in the way a person would.
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (anon) {
  const res = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    console.error(`\nSIGN-IN STILL FAILS: ${res.status} ${(await res.text()).slice(0, 200)}`);
    process.exit(1);
  }
  console.log(`\nverified    : sign-in succeeds as "${env.ADMIN_USERNAME || "admin"}"`);
} else {
  console.log("\n(no anon key — skipped the sign-in check)");
}
