-- =====================================================
-- NextUp Mentor — Enable RLS on the four tables that never had it
-- Migration 0013. Idempotent.
--
-- FOUND DURING CUTOVER TESTING: packages, destinations, messages and
-- enrollments had `relrowsecurity = false`. When RLS is disabled Postgres does
-- not evaluate policies at all — it ignores them. Every carefully-written
-- policy on these tables, including the ones migration 0012 had just added,
-- was decorative.
--
-- Live impact before this migration:
--   messages      13 contact-form submissions (name, email, phone, message)
--                 readable AND deletable by anyone holding the publishable key
--   enrollments   payment records incl. transaction ids and screenshots, same
--   packages      anyone could rewrite prices or features
--   destinations  anyone could rewrite content
--
-- schema.sql does contain ENABLE ROW LEVEL SECURITY for three of these, so it
-- was either never applied to this project or switched off afterwards in the
-- dashboard. Worth checking that no one turns it back off.
-- =====================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Retire the legacy policies. These predate the role system: they test
--    `auth.role() = 'authenticated'`, which was true for ANY signed-in user --
--    including a student -- rather than asking whether the caller is staff.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage enrollments" ON enrollments;
DROP POLICY IF EXISTS "Authenticated users can view messages"      ON messages;
DROP POLICY IF EXISTS "Authenticated users can update messages"    ON messages;
DROP POLICY IF EXISTS "Anyone can submit messages"                 ON messages;
DROP POLICY IF EXISTS "Anyone can submit enrollments"              ON enrollments;
DROP POLICY IF EXISTS "Public can view active packages"            ON packages;
DROP POLICY IF EXISTS "Public can view destinations"               ON destinations;

-- Sweep anything else left over on these four, so nothing unreviewed survives
-- the moment RLS starts being enforced. The correct replacements were created
-- in 0010/0012 and are re-asserted below.
DO $sweep$
DECLARE p record;
BEGIN
    FOR p IN
        SELECT tablename, policyname FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename IN ('packages','destinations','messages','enrollments')
           AND policyname NOT IN (
               'packages public read','packages read authed','packages admin write','packages service_role',
               'destinations public read','destinations read authed','destinations admin write','destinations service_role',
               'messages public insert','messages staff authed','messages service_role',
               'enrollments public insert','enrollments staff authed','enrollments service_role'
           )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p.policyname, p.tablename);
        RAISE NOTICE 'dropped stale policy % on %', p.policyname, p.tablename;
    END LOOP;
END $sweep$;

-- ---------------------------------------------------------------------------
-- 2. Re-assert the intended policies (idempotent -- 0012 created most of these,
--    but they were never enforced, so state them once more explicitly).
-- ---------------------------------------------------------------------------

-- packages / destinations: the world reads, admins write.
DROP POLICY IF EXISTS "packages public read"  ON packages;
CREATE POLICY "packages public read" ON packages
    FOR SELECT TO anon USING (is_active = TRUE);
DROP POLICY IF EXISTS "packages read authed" ON packages;
CREATE POLICY "packages read authed" ON packages
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "packages admin write" ON packages;
CREATE POLICY "packages admin write" ON packages
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "destinations public read"  ON destinations;
CREATE POLICY "destinations public read" ON destinations
    FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "destinations read authed" ON destinations;
CREATE POLICY "destinations read authed" ON destinations
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "destinations admin write" ON destinations;
CREATE POLICY "destinations admin write" ON destinations
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- messages / enrollments: the world writes, staff read.
DROP POLICY IF EXISTS "messages public insert" ON messages;
CREATE POLICY "messages public insert" ON messages
    FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "messages staff authed" ON messages;
CREATE POLICY "messages staff authed" ON messages
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "enrollments public insert" ON enrollments;
CREATE POLICY "enrollments public insert" ON enrollments
    FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "enrollments staff authed" ON enrollments;
CREATE POLICY "enrollments staff authed" ON enrollments
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

-- service_role keeps full access for server-side work and backups.
DO $svc$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['packages','destinations','messages','enrollments'] LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || ' service_role', t);
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
            t || ' service_role', t);
    END LOOP;
END $svc$;

-- ---------------------------------------------------------------------------
-- 3. Turn it on. Everything above is inert until this runs.
-- ---------------------------------------------------------------------------
ALTER TABLE packages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments  ENABLE ROW LEVEL SECURITY;

COMMIT;
