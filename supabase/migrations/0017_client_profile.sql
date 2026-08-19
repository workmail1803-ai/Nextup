-- =====================================================
-- NextUp Mentor — Student profile: photo + self-service details
-- Migration 0017 (ADDITIVE). Idempotent.
--
-- Two things:
--   1. A profile photo, in its OWN bucket. It does not belong in
--      `client-documents` — that bucket holds passports and bank statements, and
--      mixing a face into it means every future rule written for one applies to
--      the other. Different sensitivity, different lifetime, different bucket.
--   2. A narrow self-service update path.
--
-- WHY AN RPC AND NOT A POLICY for (2): RLS is row-level. A policy saying "a
-- student may update their own row" would also let them set `stage = 'enrolled'`
-- or reassign their consultant, because those live on the same row. Postgres
-- does have column privileges, but they are invisible at the call site — six
-- months from now nobody remembers which columns were granted. This function is
-- the allow-list, written down, in one place.
-- =====================================================

-- ---------------------------------------------------------------------------
-- 1. Where the photo lives. Stores a storage PATH, never a public URL: the
--    bucket is private and the app mints a short-lived signed URL per view.
-- ---------------------------------------------------------------------------
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ---------------------------------------------------------------------------
-- 2. Self-service profile update.
--
--    Editable: how we reach them, and their own exam results.
--    NOT editable: stage, consultant, notes, email.
--      * stage/consultant are the company's assessment of the file
--      * notes are internal
--      * email is the identity the portal claim binds to — letting a student
--        change it would hand them someone else's file
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal_update_profile(
    p_whatsapp     TEXT DEFAULT NULL,
    p_facebook_id  TEXT DEFAULT NULL,
    p_ssc_result   TEXT DEFAULT NULL,
    p_ssc_year     SMALLINT DEFAULT NULL,
    p_hsc_result   TEXT DEFAULT NULL,
    p_hsc_year     SMALLINT DEFAULT NULL,
    p_ielts_score  NUMERIC DEFAULT NULL,
    p_country_interest TEXT[] DEFAULT NULL,
    p_avatar_url   TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    target UUID;
BEGIN
    SELECT id INTO target FROM clients WHERE auth_user_id = auth.uid();
    IF target IS NULL THEN
        RAISE EXCEPTION 'no client record for this account';
    END IF;

    -- Reject nonsense before it reaches the CRM, where staff would have to
    -- unpick it. A year in the future or an IELTS band above 9 is a typo.
    IF p_ssc_year IS NOT NULL AND (p_ssc_year < 1950 OR p_ssc_year > EXTRACT(YEAR FROM now()) + 1) THEN
        RAISE EXCEPTION 'SSC year looks wrong';
    END IF;
    IF p_hsc_year IS NOT NULL AND (p_hsc_year < 1950 OR p_hsc_year > EXTRACT(YEAR FROM now()) + 1) THEN
        RAISE EXCEPTION 'HSC year looks wrong';
    END IF;
    IF p_ielts_score IS NOT NULL AND (p_ielts_score < 0 OR p_ielts_score > 9) THEN
        RAISE EXCEPTION 'IELTS score must be between 0 and 9';
    END IF;

    -- COALESCE: NULL means "not submitted by this form", not "clear it".
    UPDATE clients SET
        whatsapp         = COALESCE(p_whatsapp, whatsapp),
        facebook_id      = COALESCE(p_facebook_id, facebook_id),
        ssc_result       = COALESCE(p_ssc_result, ssc_result),
        ssc_year         = COALESCE(p_ssc_year, ssc_year),
        hsc_result       = COALESCE(p_hsc_result, hsc_result),
        hsc_year         = COALESCE(p_hsc_year, hsc_year),
        ielts_score      = COALESCE(p_ielts_score, ielts_score),
        country_interest = COALESCE(p_country_interest, country_interest),
        avatar_url       = COALESCE(p_avatar_url, avatar_url),
        updated_at       = now()
     WHERE id = target;

    RETURN target;
END $fn$;

REVOKE ALL ON FUNCTION portal_update_profile(TEXT, TEXT, TEXT, SMALLINT, TEXT, SMALLINT, NUMERIC, TEXT[], TEXT) FROM public;
GRANT EXECUTE ON FUNCTION portal_update_profile(TEXT, TEXT, TEXT, SMALLINT, TEXT, SMALLINT, NUMERIC, TEXT[], TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Storage policies for the avatar bucket.
--    Same shape as client-documents: a student is confined to the folder named
--    after their own client id; staff see everything.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "avatars student read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars student write"  ON storage.objects;
DROP POLICY IF EXISTS "avatars student update" ON storage.objects;
DROP POLICY IF EXISTS "avatars staff"          ON storage.objects;

CREATE POLICY "avatars staff" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'client-avatars' AND is_staff())
    WITH CHECK (bucket_id = 'client-avatars' AND is_staff());

CREATE POLICY "avatars student read" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'client-avatars'
        AND (storage.foldername(name))[1] IN (
            SELECT c.id::text FROM clients c WHERE c.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "avatars student write" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'client-avatars'
        AND (storage.foldername(name))[1] IN (
            SELECT c.id::text FROM clients c WHERE c.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "avatars student update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'client-avatars'
        AND (storage.foldername(name))[1] IN (
            SELECT c.id::text FROM clients c WHERE c.auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        bucket_id = 'client-avatars'
        AND (storage.foldername(name))[1] IN (
            SELECT c.id::text FROM clients c WHERE c.auth_user_id = auth.uid()
        )
    );

-- =====================================================
-- DONE. The `client-avatars` bucket itself must be created through the Storage
-- API — Postgres refuses direct writes to storage tables.
-- =====================================================
