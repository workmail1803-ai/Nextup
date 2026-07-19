# Client Portal — setup & security notes

The student portal lives at **`/portal`** (login at `/portal/login`). Students sign in
with **Supabase Auth** (Google or an emailed sign-in link), and each student sees **only
their own** journey, documents, and meetings.

Routes: `/portal` (home / journey tracker), `/portal/documents` (visa checklist),
`/portal/meetings`.

---

## What you must do to turn it on

These three steps are in **your Supabase dashboard** — I can't do them from code.

### 1. Apply the database migration
Open **Supabase → SQL Editor** and run `supabase/migrations/0008_client_portal_auth.sql`.
It adds `clients.auth_user_id`, re-scopes the existing permissive policies to the `anon`
role (so staff surfaces keep working unchanged), adds `authenticated` self-only policies,
and creates the `public_mentors` view. It's idempotent — safe to re-run.

### 2. Enable the auth providers
- **Google:** Supabase → Authentication → Providers → **Google** → enable. You'll need an
  OAuth client from Google Cloud Console; set its authorized redirect URI to
  `https://<your-project-ref>.supabase.co/auth/v1/callback`.
- **Email:** Authentication → Providers → **Email** → enable (this powers the "email me a
  sign-in link" option). Supabase's built-in email is heavily rate-limited — configure SMTP
  (Authentication → Emails) before real use.

### 3. Allow-list the redirect URLs
Authentication → **URL Configuration**:
- **Site URL:** your production domain (e.g. `https://nextupmentor.com`).
- **Redirect URLs:** add `http://localhost:3000/**` (dev) and `https://<your-domain>/**` (prod).

---

## How a student gets linked to their file

Linking is by **email**. When a student signs in, the portal finds the `clients` row whose
`email` matches and binds it (`auth_user_id`) on first login (the "claim" pattern). So:

- A student can only reach their portal if **their email is on their client record**. If it
  isn't, they see a friendly "we couldn't find your file — ask your consultant" screen.
- Practical step: make sure the `email` field is filled in for clients you want to give
  portal access. You can add emails from the staff CRM.

---

## Security — the honest state

- **After migration 0008, portal data is genuinely locked down** at the database level:
  a signed-in student's queries run as the `authenticated` role and RLS returns only their
  own client row, meetings, and visa documents. The `public_mentors` view exposes only a
  consultant's name/title/photo — never `staff_code`.
- **Residual gap (unchanged by this work):** the staff surfaces (`/crm`, `/admin`,
  `/staff_portal`) still read via the public **anon key**, which ships in the browser
  bundle. That key can read the full `clients` table. Closing that gap means getting staff
  off the anon key and onto the server API — that's Phase 0 of `IMPLEMENTATION_PLAN.md`, not
  this change. So: the **portal path is private; the staff anon path is the known exposure**
  until the backend rebuild.

---

## What's verified vs. what needs your config

Verified locally: routes build, types/lint clean, the auth **gate works** (visiting
`/portal` with no session redirects to `/portal/login`), and the login + portal screens
render correctly on mobile and desktop.

Not verifiable without your dashboard config (steps 1–3 above): the actual Google / email
sign-in round-trip. Once those are set, sign in with a student email that exists on a
client record to see the full portal.
