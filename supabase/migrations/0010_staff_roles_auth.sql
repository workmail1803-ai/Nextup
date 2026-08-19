-- =====================================================
-- NextUp Mentor — Staff roles + real staff auth
-- Migration 0010 (ADDITIVE). Idempotent.
--
-- WHAT THIS DOES
--   1. Gives `staff` a role (admin | staff), an email, and an auth.users link.
--   2. Adds security-definer helpers is_admin() / is_staff() / current_staff_id()
--      so RLS can ask "who is this?" without recursing into `staff`.
--   3. Adds `authenticated` policies across every table, gated on those helpers.
--      Finance is admin-only. Staff get the operational tables.
--   4. Fixes the storage policies on client-documents, which were open to the
--      world (any caller could read/replace/DELETE any student's passport).
--   5. Fixes the portal upload bug: students had SELECT but no UPDATE on
--      visa_document_items, so uploads silently failed to record file_url.
--
-- WHAT THIS DELIBERATELY DOES *NOT* DO
--   The blanket `anon` policies stay in place. nextupmentor.com is live and the
--   current staff surfaces authenticate in the browser with the anon key --
--   revoking anon here would take the production site down. Anon revocation is
--   migration 0012, applied only once the new staff auth is wired up in the app.
--   Until then, finance is hidden in the UI but still reachable via the anon key.
-- =====================================================

-- ---------------------------------------------------------------------------
-- 1. Roles + identity on staff
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE staff_role AS ENUM ('admin', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE staff ADD COLUMN IF NOT EXISTS role         staff_role NOT NULL DEFAULT 'staff';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email        VARCHAR(255);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Each lookup path gets its own index.
--   email (lower)  -- the claim-by-email join on every sign-in
--   auth_user_id   -- the anchor for is_admin()/is_staff() on EVERY RLS check
--   role           -- admin listings and role filters
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_email_lower ON staff (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_auth_user ON staff (auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_role      ON staff (role);

-- ---------------------------------------------------------------------------
-- 2. Identity helpers
--
-- SECURITY DEFINER is required: these are called from inside policies ON staff,
-- so a plain function would re-enter staff's own RLS and recurse forever.
-- STABLE lets the planner call them once per statement, not once per row --
-- that is what keeps these cheap on large scans.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_staff_id() RETURNS UUID
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT id FROM staff WHERE auth_user_id = auth.uid() AND status = 'active' LIMIT 1;
$fn$;

CREATE OR REPLACE FUNCTION is_staff() RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT EXISTS (
        SELECT 1 FROM staff WHERE auth_user_id = auth.uid() AND status = 'active'
    );
$fn$;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT EXISTS (
        SELECT 1 FROM staff
        WHERE auth_user_id = auth.uid() AND status = 'active' AND role = 'admin'
    );
$fn$;

REVOKE ALL ON FUNCTION current_staff_id(), is_staff(), is_admin() FROM public;
GRANT EXECUTE ON FUNCTION current_staff_id(), is_staff(), is_admin() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- 3. Claim-by-email -- bind a signing-in user to their pre-created staff row.
--
-- Mirrors the student-portal claim pattern (migration 0008): an admin creates
-- the staff row with an email, the person signs up with that email, and this
-- binds the two. No pre-provisioned auth user, no service-role key in the app.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_staff_account() RETURNS UUID
    LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    claimed UUID;
BEGIN
    IF auth.uid() IS NULL THEN RETURN NULL; END IF;

    -- Already bound? Just stamp the login.
    SELECT id INTO claimed FROM staff WHERE auth_user_id = auth.uid() AND status = 'active';
    IF claimed IS NOT NULL THEN
        UPDATE staff SET last_login_at = now() WHERE id = claimed;
        RETURN claimed;
    END IF;

    -- Otherwise bind the unclaimed row whose email matches this identity.
    UPDATE staff
       SET auth_user_id = auth.uid(), last_login_at = now()
     WHERE auth_user_id IS NULL
       AND email IS NOT NULL
       AND lower(email) = lower(auth.email())
       AND status = 'active'
     RETURNING id INTO claimed;

    RETURN claimed;
END $fn$;

REVOKE ALL ON FUNCTION claim_staff_account() FROM public;
GRANT EXECUTE ON FUNCTION claim_staff_account() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. `authenticated` policies, gated by role.
--    Existing anon policies are untouched (see header).
-- ---------------------------------------------------------------------------

-- staff: everyone signed in can read the roster (needed for assignment pickers
-- and the "your consultant" card); only admins may write it.
DROP POLICY IF EXISTS "staff read authed"  ON staff;
DROP POLICY IF EXISTS "staff admin write"  ON staff;
CREATE POLICY "staff read authed" ON staff
    FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "staff admin write" ON staff
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Operational tables: any active staff member. Admin is a superset of staff,
-- so is_staff() covers both.
DROP POLICY IF EXISTS "clients staff authed" ON clients;
CREATE POLICY "clients staff authed" ON clients
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "meetings staff authed" ON client_meetings;
CREATE POLICY "meetings staff authed" ON client_meetings
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "visa staff authed" ON client_visa;
CREATE POLICY "visa staff authed" ON client_visa
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "docitems staff authed" ON visa_document_items;
CREATE POLICY "docitems staff authed" ON visa_document_items
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "appointments staff authed" ON appointments;
CREATE POLICY "appointments staff authed" ON appointments
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "avail staff authed" ON staff_availability;
CREATE POLICY "avail staff authed" ON staff_availability
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

-- Attendance: a staff member reads/writes their OWN sessions; admin sees and
-- edits everyone's (this is what "admin can edit worktime" needs).
DROP POLICY IF EXISTS "attendance own"   ON attendance_sessions;
DROP POLICY IF EXISTS "attendance admin" ON attendance_sessions;
CREATE POLICY "attendance own" ON attendance_sessions
    FOR ALL TO authenticated
    USING (staff_id = current_staff_id())
    WITH CHECK (staff_id = current_staff_id());
CREATE POLICY "attendance admin" ON attendance_sessions
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Notifications: yours only.
-- Guarded: migration 0007 was never applied to this database, so the table may
-- not exist. Skipping keeps this migration runnable against the live schema.
DO $guard$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        EXECUTE 'DROP POLICY IF EXISTS "notifications own" ON notifications';
        EXECUTE 'CREATE POLICY "notifications own" ON notifications
                 FOR ALL TO authenticated
                 USING (recipient_staff_id = current_staff_id())
                 WITH CHECK (recipient_staff_id = current_staff_id())';
    END IF;
END $guard$;

-- Content tables: staff read, admin writes.
DROP POLICY IF EXISTS "packages read authed"  ON packages;
DROP POLICY IF EXISTS "packages admin write"  ON packages;
CREATE POLICY "packages read authed" ON packages
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "packages admin write" ON packages
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "destinations read authed" ON destinations;
DROP POLICY IF EXISTS "destinations admin write" ON destinations;
CREATE POLICY "destinations read authed" ON destinations
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "destinations admin write" ON destinations
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "messages staff authed" ON messages;
CREATE POLICY "messages staff authed" ON messages
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "enrollments staff authed" ON enrollments;
CREATE POLICY "enrollments staff authed" ON enrollments
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

-- ---------------------------------------------------------------------------
-- 5. FINANCE -- admin only. This is the requirement "staff cannot see finance",
--    enforced at the database rather than by hiding a nav item.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "expenses admin only"   ON expenses;
DROP POLICY IF EXISTS "expcat admin only"     ON expense_categories;
DROP POLICY IF EXISTS "explogs admin only"    ON expense_logs;
DROP POLICY IF EXISTS "budgets admin only"    ON budgets;

CREATE POLICY "expenses admin only" ON expenses
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "expcat admin only" ON expense_categories
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "explogs admin only" ON expense_logs
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "budgets admin only" ON budgets
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 6. Portal upload fix.
--    0008 gave students SELECT on visa_document_items but no UPDATE, so
--    VisaService.uploadDocumentFile()'s write matched zero rows and returned
--    no error -- the file landed in storage and the row never recorded it.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "docitems portal update" ON visa_document_items;
CREATE POLICY "docitems portal update" ON visa_document_items
    FOR UPDATE TO authenticated
    USING (
        visa_id IN (
            SELECT v.id FROM client_visa v
            JOIN clients c ON c.id = v.client_id
            WHERE c.auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        visa_id IN (
            SELECT v.id FROM client_visa v
            JOIN clients c ON c.id = v.client_id
            WHERE c.auth_user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- 7. STORAGE -- client-documents was world-open.
--
--    The old policies checked only `bucket_id`, with role `public`. Any caller
--    holding the publishable key could read, overwrite or DELETE any student's
--    passport scan or bank statement by path. Paths are `<clientId>/<docId>/...`,
--    and client ids were listable with the same key.
--
--    Replaced with: a student reaches only the folder matching their own client
--    id; staff (anon, until cutover) and admins keep full access.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow read on client-documents"   ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to client-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow update on client-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete on client-documents" ON storage.objects;
DROP POLICY IF EXISTS "clientdocs staff anon"     ON storage.objects;
DROP POLICY IF EXISTS "clientdocs staff authed"   ON storage.objects;
DROP POLICY IF EXISTS "clientdocs student rw"     ON storage.objects;
DROP POLICY IF EXISTS "clientdocs student insert" ON storage.objects;
DROP POLICY IF EXISTS "clientdocs student update" ON storage.objects;

-- Staff via the anon key -- kept until the 0012 cutover, then narrowed.
CREATE POLICY "clientdocs staff anon" ON storage.objects
    FOR ALL TO anon
    USING (bucket_id = 'client-documents')
    WITH CHECK (bucket_id = 'client-documents');

-- Signed-in staff/admin.
CREATE POLICY "clientdocs staff authed" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'client-documents' AND is_staff())
    WITH CHECK (bucket_id = 'client-documents' AND is_staff());

-- A student: only their own client folder. No DELETE -- replacing a file is an
-- upsert (INSERT/UPDATE); students never need to destroy an uploaded record.
CREATE POLICY "clientdocs student rw" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'client-documents'
        AND (storage.foldername(name))[1] IN (
            SELECT c.id::text FROM clients c WHERE c.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "clientdocs student insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'client-documents'
        AND (storage.foldername(name))[1] IN (
            SELECT c.id::text FROM clients c WHERE c.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "clientdocs student update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'client-documents'
        AND (storage.foldername(name))[1] IN (
            SELECT c.id::text FROM clients c WHERE c.auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        bucket_id = 'client-documents'
        AND (storage.foldername(name))[1] IN (
            SELECT c.id::text FROM clients c WHERE c.auth_user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- 8. Drop the dead `admins` table -- empty, created outside migrations, and
--    referenced by no code. Roles now live on `staff`.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS admins;

-- =====================================================
-- DONE.
-- =====================================================
