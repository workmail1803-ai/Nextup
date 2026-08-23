-- =====================================================
-- NextUp Mentor — Feature photos for the home page
-- Migration 0028. Idempotent.
--
-- A sliding card on the hero showing real photographs, managed by an admin.
--
-- WHY THIS MATTERS MORE THAN IT LOOKS: the audit in this repo names "no imagery
-- of the actual product — no students, no campuses, no founder faces" as a major
-- credibility gap for a business asking families to hand over their savings.
-- Every other proof element on that page is a claim in text. This is the one
-- place the site can show rather than assert, so it is worth an admin being able
-- to keep it current without a developer.
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    /** Public storage URL in the feature-photos bucket. */
    url         TEXT NOT NULL,
    /** Storage path, kept so the file can be deleted with the row. */
    path        TEXT,
    caption     TEXT,
    /** Shown under the caption, e.g. "Sapienza, Rome — Sept 2026". */
    location    TEXT,
    /** Screen-reader text. Falls back to the caption when blank. */
    alt         TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  SMALLINT NOT NULL DEFAULT 1,
    uploaded_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The home page asks for the active set in order, on every visit.
CREATE INDEX IF NOT EXISTS idx_feature_photos_order
    ON feature_photos (sort_order) WHERE is_active;

ALTER TABLE feature_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature photos public read" ON feature_photos;
DROP POLICY IF EXISTS "feature photos authed read" ON feature_photos;
DROP POLICY IF EXISTS "feature photos admin write" ON feature_photos;
DROP POLICY IF EXISTS "feature photos service"    ON feature_photos;

CREATE POLICY "feature photos public read" ON feature_photos
    FOR SELECT TO anon USING (is_active);
CREATE POLICY "feature photos authed read" ON feature_photos
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "feature photos admin write" ON feature_photos
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "feature photos service" ON feature_photos
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Storage. The bucket is public: these photographs are the point of the
-- section, shown to anonymous visitors on the home page. Writing is still
-- admin-only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "featurephotos public read" ON storage.objects;
DROP POLICY IF EXISTS "featurephotos admin write" ON storage.objects;

CREATE POLICY "featurephotos public read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'feature-photos');

CREATE POLICY "featurephotos admin write" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'feature-photos' AND is_admin())
    WITH CHECK (bucket_id = 'feature-photos' AND is_admin());

-- =====================================================
-- DONE. Bucket `feature-photos` created via the Storage API.
-- =====================================================
