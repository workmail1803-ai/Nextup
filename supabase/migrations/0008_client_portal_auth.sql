-- =====================================================
-- NextUp Mentor — Client Portal auth link + scoped RLS
-- Migration 0008 (ADDITIVE, but CHANGES existing RLS policies). Idempotent.
--
-- WHY: the portal lets a student sign in with Supabase Auth (Google / email).
-- Today's "Allow all USING (true)" policies apply to the `public` role, which
-- includes `authenticated` — so a logged-in student would inherit "see every
-- client". This migration re-scopes the permissive staff policies to the
-- `anon` role (the staff surfaces use the anon key and keep working unchanged)
-- and adds `authenticated` policies that expose ONLY the signed-in student's
-- own record, using a claim-by-email pattern.
--
-- SAFE FOR STAFF: /crm, /admin, /staff_portal all use the anon key → role
-- `anon` → still full access. Only genuinely-authenticated portal users are
-- restricted.
-- =====================================================

-- 1. Identity link: which auth.users row owns this client record.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_user_id UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- Indexes that keep every portal + RLS lookup off a sequential scan:
--  * auth_user_id — the anchor for "my own row" in every portal policy.
--  * lower(email)  — the portal finds a student by email, and the claim policy
--                    compares lower(email) = lower(auth.email()) on every request.
CREATE INDEX IF NOT EXISTS idx_clients_auth_user  ON clients (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email_lower ON clients (lower(email));

-- 2. clients — re-scope staff access to anon; add portal self + claim.
DROP POLICY IF EXISTS "Allow all for clients" ON clients;
DROP POLICY IF EXISTS "clients staff all"     ON clients;
DROP POLICY IF EXISTS "clients portal select" ON clients;
DROP POLICY IF EXISTS "clients portal claim"  ON clients;

CREATE POLICY "clients staff all" ON clients
    FOR ALL TO anon, service_role USING (true) WITH CHECK (true);

-- A student sees their own row, or an unclaimed row matching their email.
CREATE POLICY "clients portal select" ON clients
    FOR SELECT TO authenticated
    USING (
        auth_user_id = auth.uid()
        OR (auth_user_id IS NULL AND email IS NOT NULL AND lower(email) = lower(auth.email()))
    );

-- A student may claim their unclaimed row (bind their identity) — only to self.
CREATE POLICY "clients portal claim" ON clients
    FOR UPDATE TO authenticated
    USING (auth_user_id IS NULL AND email IS NOT NULL AND lower(email) = lower(auth.email()))
    WITH CHECK (auth_user_id = auth.uid());

-- 3. client_meetings — staff via anon; student reads only their own meetings.
DROP POLICY IF EXISTS "Allow all for client_meetings" ON client_meetings;
DROP POLICY IF EXISTS "meetings staff all"            ON client_meetings;
DROP POLICY IF EXISTS "meetings portal select"        ON client_meetings;

CREATE POLICY "meetings staff all" ON client_meetings
    FOR ALL TO anon, service_role USING (true) WITH CHECK (true);
CREATE POLICY "meetings portal select" ON client_meetings
    FOR SELECT TO authenticated
    USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));

-- 4. client_visa
DROP POLICY IF EXISTS "Allow all for client_visa" ON client_visa;
DROP POLICY IF EXISTS "visa staff all"            ON client_visa;
DROP POLICY IF EXISTS "visa portal select"        ON client_visa;

CREATE POLICY "visa staff all" ON client_visa
    FOR ALL TO anon, service_role USING (true) WITH CHECK (true);
CREATE POLICY "visa portal select" ON client_visa
    FOR SELECT TO authenticated
    USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));

-- 5. visa_document_items
DROP POLICY IF EXISTS "Allow all for visa_document_items" ON visa_document_items;
DROP POLICY IF EXISTS "docitems staff all"                ON visa_document_items;
DROP POLICY IF EXISTS "docitems portal select"            ON visa_document_items;

CREATE POLICY "docitems staff all" ON visa_document_items
    FOR ALL TO anon, service_role USING (true) WITH CHECK (true);
CREATE POLICY "docitems portal select" ON visa_document_items
    FOR SELECT TO authenticated
    USING (
        visa_id IN (
            SELECT v.id FROM client_visa v
            JOIN clients c ON c.id = v.client_id
            WHERE c.auth_user_id = auth.uid()
        )
    );

-- 6. Safe consultant lookup for the portal "your mentor" card.
-- A security-definer view exposes ONLY display fields — never staff_code
-- (which is the staff-portal login credential and must not leak to clients).
CREATE OR REPLACE VIEW public_mentors AS
    SELECT id, full_name, title, avatar_url
    FROM staff
    WHERE status = 'active';
GRANT SELECT ON public_mentors TO authenticated, anon;

-- =====================================================
-- DONE. Enable the Google provider + email auth in the Supabase dashboard and
-- add your site URLs to Auth → URL Configuration (see PORTAL_SETUP.md).
-- =====================================================
