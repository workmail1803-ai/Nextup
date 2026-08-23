-- =====================================================
-- NextUp Mentor — Editable reviews + editable single images
-- Migration 0029. Idempotent.
--
-- Two things the admin asked to control without a developer:
--   1. the student reviews on the home page, photo included
--   2. the team photo in the "Our story" band
--
-- WHY `is_verified` EXISTS
-- The three reviews currently hardcoded on the home page are placeholders, and
-- the section says so out loud: "Stories shown are representative while we
-- gather consent for full names and photos." Moving them into a table they can
-- be edited in would quietly delete that admission — the same words, now
-- presented as real customer reviews, which is a fabricated testimonial.
--
-- So consent is a column. A review is unverified until someone ticks the box
-- saying this is a real person who agreed to be quoted, and the public section
-- keeps showing the disclaimer for as long as any unverified review is on
-- screen. The honest state is the default; the claim requires an action.
-- =====================================================

CREATE TABLE IF NOT EXISTS testimonials (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote        TEXT NOT NULL,
    student_name TEXT NOT NULL,
    /** e.g. "MSc Computer Science" */
    program      TEXT,
    /** e.g. "Sapienza · Italy" */
    place        TEXT,
    /** Optional photo. Without one the card falls back to a monogram. */
    avatar_url   TEXT,
    avatar_path  TEXT,
    /** Monogram background when there is no photo. */
    accent       TEXT NOT NULL DEFAULT '#a85a1a',
    /**
     * FALSE until a human confirms this is a real person who consented to be
     * quoted by name. Drives the disclaimer on the public section.
     */
    is_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order   SMALLINT NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The home page asks for the active set in order, on every visit.
CREATE INDEX IF NOT EXISTS idx_testimonials_order
    ON testimonials (sort_order) WHERE is_active;

-- ---------------------------------------------------------------------------
-- Single editable bits of the marketing site: one image or one string each,
-- addressed by a stable key. A table per one-off image would be a table per
-- paragraph before long.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_content (
    key         TEXT PRIMARY KEY,
    text_value  TEXT,
    image_url   TEXT,
    image_path  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE testimonials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "testimonials public read"  ON testimonials;
DROP POLICY IF EXISTS "testimonials authed read"  ON testimonials;
DROP POLICY IF EXISTS "testimonials admin write"  ON testimonials;
DROP POLICY IF EXISTS "testimonials service"      ON testimonials;

CREATE POLICY "testimonials public read" ON testimonials
    FOR SELECT TO anon USING (is_active);
CREATE POLICY "testimonials authed read" ON testimonials
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "testimonials admin write" ON testimonials
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "testimonials service" ON testimonials
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "site content public read" ON site_content;
DROP POLICY IF EXISTS "site content authed read" ON site_content;
DROP POLICY IF EXISTS "site content admin write" ON site_content;
DROP POLICY IF EXISTS "site content service"     ON site_content;

CREATE POLICY "site content public read" ON site_content
    FOR SELECT TO anon USING (true);
CREATE POLICY "site content authed read" ON site_content
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "site content admin write" ON site_content
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "site content service" ON site_content
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Storage: site-media. Public, because these are marketing images shown to
-- anonymous visitors. Writing stays admin-only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sitemedia public read" ON storage.objects;
DROP POLICY IF EXISTS "sitemedia admin write" ON storage.objects;

CREATE POLICY "sitemedia public read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'site-media');

CREATE POLICY "sitemedia admin write" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'site-media' AND is_admin())
    WITH CHECK (bucket_id = 'site-media' AND is_admin());

-- ---------------------------------------------------------------------------
-- Seed the three placeholders that are already live, so nothing vanishes from
-- the home page on deploy. They arrive as is_verified = FALSE, which is what
-- they are — the disclaimer they ship with today stays on screen until someone
-- replaces them with real, consented reviews.
-- ---------------------------------------------------------------------------
INSERT INTO testimonials (quote, student_name, program, place, accent, sort_order, is_verified)
VALUES
  ('I almost signed with an agency that wanted to hold my logins. NextUp let me keep everything and walked me through each form. I''m in Rome now.',
   'Tasnia R.', 'MSc Computer Science', 'Sapienza · Italy', '#a85a1a', 1, FALSE),
  ('They''d actually been through the Lithuania visa themselves, so the advice was real, not guesswork. Approved on the first try.',
   'Ridwan H.', 'BSc Business', 'Vilnius · Lithuania', '#7a8b6f', 2, FALSE),
  ('What surprised me was the help after I landed — finding a flat, opening a bank account. It didn''t feel like a transaction.',
   'Mehjabin A.', 'MA Economics', 'Bologna · Italy', '#6f7e93', 3, FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO site_content (key, text_value)
VALUES
  ('testimonials_lede', 'Real journeys, in their own words.'),
  ('team_photo_caption', 'The founders on campus in Europe')
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_content (key) VALUES ('team_photo')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- DONE. Bucket `site-media` is created via the Storage API.
-- =====================================================
