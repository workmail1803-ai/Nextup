-- =====================================================
-- NextUp Mentor — Cutover: retire the anon blanket policies
-- Migration 0012. Idempotent.
--
-- Until now every table carried a legacy `FOR ALL USING (true)` policy granted
-- to role `public`. Two consequences, both live:
--   * `public` includes `authenticated`, and RLS ORs policies together — so the
--     admin-only finance policies from 0010 were never actually restrictive. A
--     signed-in *student* could read the finance tables.
--   * `anon` is whoever holds the publishable key, i.e. any visitor. That is
--     read access to the full client table: names, emails, phone numbers.
--
-- This replaces them with the narrow set of grants the PUBLIC site genuinely
-- needs, and nothing else. Everything internal now requires a real JWT, where
-- is_staff()/is_admin() decide.
--
-- PREREQUISITE (done in the same change): every staff-facing service was moved
-- off the anon client onto `staffSupabase`. Applying this before that lands
-- would break every internal page, because no query would carry a JWT.
--
-- What the public site still needs, and why:
--   packages, destinations  SELECT — pricing and destination pages
--   public_mentors          SELECT — the /book mentor picker (a view exposing
--                                    only id/name/title/avatar, never staff_code)
--   staff_availability      SELECT — bookable slots on /book
--   appointments            INSERT — public booking form
--   messages                INSERT — contact form
--   enrollments             INSERT — PaymentModal
-- Note the asymmetry: the public may WRITE appointments/messages/enrollments
-- but never READ them back. Insert-only is what a submit box actually needs.
-- =====================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Drop every legacy blanket policy.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all for staff"                ON staff;
DROP POLICY IF EXISTS "Allow all for attendance"           ON attendance_sessions;
DROP POLICY IF EXISTS "Allow all for packages"             ON packages;
DROP POLICY IF EXISTS "Allow all for enrollments"          ON enrollments;
DROP POLICY IF EXISTS "Allow all for messages"             ON messages;
DROP POLICY IF EXISTS "Allow all for expense_categories"   ON expense_categories;
DROP POLICY IF EXISTS "Allow all for budgets"              ON budgets;
DROP POLICY IF EXISTS "Allow all for expenses"             ON expenses;
DROP POLICY IF EXISTS "Allow all for expense_logs"         ON expense_logs;
DROP POLICY IF EXISTS "Allow all for staff_availability"   ON staff_availability;
DROP POLICY IF EXISTS "Allow all for appointments"         ON appointments;

-- 0008 re-scoped these to anon; that grant is what this migration retires.
DROP POLICY IF EXISTS "clients staff all"   ON clients;
DROP POLICY IF EXISTS "meetings staff all"  ON client_meetings;
DROP POLICY IF EXISTS "visa staff all"      ON client_visa;
DROP POLICY IF EXISTS "docitems staff all"  ON visa_document_items;

-- Destinations' policy name differs by environment; drop whatever is there.
DO $d$
DECLARE p record;
BEGIN
    FOR p IN SELECT policyname FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'destinations'
                AND policyname ILIKE 'Allow all%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON destinations', p.policyname);
    END LOOP;
END $d$;

-- ---------------------------------------------------------------------------
-- 2. service_role keeps full access (server-side jobs, admin API, backups).
-- ---------------------------------------------------------------------------
DO $svc$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'clients','client_meetings','client_visa','visa_document_items',
        'staff','staff_availability','appointments','attendance_sessions',
        'packages','destinations','messages','enrollments',
        'expenses','expense_categories','expense_logs','budgets'
    ] LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || ' service_role', t);
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
            t || ' service_role', t);
    END LOOP;
END $svc$;

-- ---------------------------------------------------------------------------
-- 3. The public site: read-only where it must read, insert-only where it writes.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "packages public read" ON packages;
CREATE POLICY "packages public read" ON packages
    FOR SELECT TO anon USING (is_active = TRUE);

DROP POLICY IF EXISTS "destinations public read" ON destinations;
CREATE POLICY "destinations public read" ON destinations
    FOR SELECT TO anon USING (true);

-- Bookable slots. The mentor identities come from the public_mentors view,
-- which is already granted to anon in 0008.
DROP POLICY IF EXISTS "availability public read" ON staff_availability;
CREATE POLICY "availability public read" ON staff_availability
    FOR SELECT TO anon USING (is_active = TRUE);

-- Write-only submit boxes: INSERT with no matching SELECT policy, so a
-- visitor can file a booking/message/enrolment and cannot read anyone's.
DROP POLICY IF EXISTS "appointments public insert" ON appointments;
CREATE POLICY "appointments public insert" ON appointments
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "messages public insert" ON messages;
CREATE POLICY "messages public insert" ON messages
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "enrollments public insert" ON enrollments;
CREATE POLICY "enrollments public insert" ON enrollments
    FOR INSERT TO anon WITH CHECK (true);

-- The booking form checks whether a phone number is already booked before
-- inserting. That needs a SELECT, but must not expose the queue — so it is
-- scoped to the id column via a security-definer function instead of a policy.
CREATE OR REPLACE FUNCTION phone_already_booked(p_phone TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT EXISTS (SELECT 1 FROM appointments WHERE phone = p_phone);
$fn$;
REVOKE ALL ON FUNCTION phone_already_booked(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION phone_already_booked(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Storage: anon loses the client-documents bucket entirely.
--    Staff reach it with a JWT (0010's "clientdocs staff authed"), students
--    only inside their own folder.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "clientdocs staff anon" ON storage.objects;

COMMIT;
