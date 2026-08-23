-- =====================================================
-- NextUp Mentor — Editable homepage figures
-- Migration 0027. Idempotent.
--
-- The four numbers under the hero ("1,140+ students guided", "90% visa approval
-- rate", …) were hardcoded in a React component, so changing a claim about the
-- business needed a developer and a deploy.
--
-- These are PUBLIC CLAIMS about outcomes. The audit report in this repo already
-- flags unbacked claims as the site's main credibility risk, so the point of
-- moving them into the database is not convenience — it is that whoever is
-- accountable for the claim can correct it the moment it stops being true.
--
-- Both the number AND its wording are editable. "95%" with the label "Visa
-- approval rate" is a different assertion from "95%" with "Visa approval rate
-- for completed applications", and only one of them may be defensible.
-- =====================================================

CREATE TABLE IF NOT EXISTS site_stats (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    /** Stable handle so a reorder or rename cannot orphan the row. */
    key         TEXT NOT NULL UNIQUE,
    value       NUMERIC NOT NULL DEFAULT 0,
    prefix      TEXT NOT NULL DEFAULT '',
    suffix      TEXT NOT NULL DEFAULT '',
    label       TEXT NOT NULL,
    note        TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  SMALLINT NOT NULL DEFAULT 1,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The homepage reads the active set in order on every render.
CREATE INDEX IF NOT EXISTS idx_site_stats_order ON site_stats (sort_order) WHERE is_active;

DROP TRIGGER IF EXISTS trg_site_stats_updated ON site_stats;
CREATE TRIGGER trg_site_stats_updated BEFORE UPDATE ON site_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed from what the component currently hardcodes, so nothing changes on the
-- page until someone deliberately edits it.
INSERT INTO site_stats (key, value, prefix, suffix, label, note, sort_order) VALUES
    ('students_guided',     1200, '',  '+', 'Students guided',      'since 2022',                  1),
    ('visa_approval',         95, '',  '%', 'Visa approval rate',   'across our cohorts',          2),
    ('partner_universities',  40, '',  '+', 'Partner universities', 'in 6 countries',              3),
    ('hidden_fees',            0, '৳', '',  'Hidden fees',          'you pay everything yourself', 4)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS: the world reads, admins write.
-- ---------------------------------------------------------------------------
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site stats public read"  ON site_stats;
DROP POLICY IF EXISTS "site stats authed read"  ON site_stats;
DROP POLICY IF EXISTS "site stats admin write"  ON site_stats;
DROP POLICY IF EXISTS "site stats service"      ON site_stats;

CREATE POLICY "site stats public read" ON site_stats
    FOR SELECT TO anon USING (is_active);
CREATE POLICY "site stats authed read" ON site_stats
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "site stats admin write" ON site_stats
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "site stats service" ON site_stats
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- DONE.
-- =====================================================
