-- =====================================================
-- NextUp Mentor — Staff profile photos
-- Migration 0023. Idempotent.
--
-- WHY THIS BUCKET IS PUBLIC, WHEN client-avatars IS NOT
--   A student's photo is personal data belonging to them: private bucket,
--   signed URLs, visible only to them and their consultant.
--
--   A mentor's photo is the opposite — it is shown to prospective students on
--   the public /book page before anyone signs in, and to every student choosing
--   who to talk to. Making it private would mean minting signed URLs for
--   anonymous visitors, which is a contradiction: a URL anyone may request is
--   not a secret, it is just a slower public URL.
--
--   So: public bucket, and staff are told it is public when they upload.
--
-- WRITES are still restricted — public to read is not public to change.
-- =====================================================

-- Path shape is <staffId>/avatar.<ext>, so the first folder is the owner.
DROP POLICY IF EXISTS "staffavatars public read" ON storage.objects;
DROP POLICY IF EXISTS "staffavatars own write"   ON storage.objects;
DROP POLICY IF EXISTS "staffavatars own update"  ON storage.objects;
DROP POLICY IF EXISTS "staffavatars own delete"  ON storage.objects;
DROP POLICY IF EXISTS "staffavatars admin"       ON storage.objects;

-- Anyone may look. This is what puts a mentor's face on the booking page.
CREATE POLICY "staffavatars public read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'staff-avatars');

-- A staff member replaces only their own.
CREATE POLICY "staffavatars own write" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'staff-avatars'
        AND (storage.foldername(name))[1] = current_staff_id()::text
    );

CREATE POLICY "staffavatars own update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'staff-avatars'
        AND (storage.foldername(name))[1] = current_staff_id()::text
    )
    WITH CHECK (
        bucket_id = 'staff-avatars'
        AND (storage.foldername(name))[1] = current_staff_id()::text
    );

CREATE POLICY "staffavatars own delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'staff-avatars'
        AND (storage.foldername(name))[1] = current_staff_id()::text
    );

-- An admin can fix anyone's — someone leaves, or uploads something unsuitable.
CREATE POLICY "staffavatars admin" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'staff-avatars' AND is_admin())
    WITH CHECK (bucket_id = 'staff-avatars' AND is_admin());

-- ---------------------------------------------------------------------------
-- Let a staff member set their OWN avatar_url without granting them write on
-- the rest of their record — role, status and staff_code stay admin-only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION staff_set_avatar(p_url TEXT)
RETURNS VOID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    me UUID := current_staff_id();
BEGIN
    IF me IS NULL THEN RAISE EXCEPTION 'staff only'; END IF;
    UPDATE staff SET avatar_url = p_url, updated_at = now() WHERE id = me;
END $fn$;

REVOKE ALL ON FUNCTION staff_set_avatar(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION staff_set_avatar(TEXT) TO authenticated;

-- =====================================================
-- DONE. public_mentors already selects avatar_url, so a mentor's photo reaches
-- the booking page and the student portal with no further change.
-- =====================================================
