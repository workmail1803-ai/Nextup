-- =====================================================
-- NextUp Mentor — Staff-added visa requirements
-- Migration 0022 (ADDITIVE). Idempotent.
--
-- Every visa file starts from the same eleven-item checklist. Real cases need
-- more: a birth certificate for a minor, a police clearance, an affidavit a
-- particular embassy asked for this month, a marriage certificate.
--
-- WHY THE STUDENT MUST SEE THE DIFFERENCE
--   A student who knows the standard list will wonder why they are being asked
--   for something extra, and the honest answer is "your consultant asked for
--   this specifically". Rendering it identically to the standard items invites
--   the suspicion that we are inventing requirements. So each row records
--   whether it is standard or added, and by whom.
-- =====================================================

ALTER TABLE visa_document_items
    ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE visa_document_items
    ADD COLUMN IF NOT EXISTS added_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;

-- The portal reads a file's checklist in sort order on every visit.
CREATE INDEX IF NOT EXISTS idx_docitems_visa_sort ON visa_document_items (visa_id, sort_order);
-- Partial: only ever queried as "which of these were added for this student".
CREATE INDEX IF NOT EXISTS idx_docitems_custom ON visa_document_items (visa_id) WHERE is_custom;

-- ---------------------------------------------------------------------------
-- Add a requirement.
--
-- Appends rather than inserting mid-list: the student may already have worked
-- through the checklist in order, and renumbering underneath them is disorienting.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION staff_add_visa_document(
    p_visa_id UUID,
    p_name    TEXT,
    p_note    TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    me      UUID := current_staff_id();
    next_no INT;
    new_id  UUID;
BEGIN
    IF NOT is_staff() THEN RAISE EXCEPTION 'staff only'; END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 THEN
        RAISE EXCEPTION 'give the document a name';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM client_visa WHERE id = p_visa_id) THEN
        RAISE EXCEPTION 'no such visa file';
    END IF;

    -- Same name twice on one file is a mistake, not a requirement.
    IF EXISTS (
        SELECT 1 FROM visa_document_items
         WHERE visa_id = p_visa_id AND lower(btrim(document_name)) = lower(btrim(p_name))
    ) THEN
        RAISE EXCEPTION 'that document is already on this checklist';
    END IF;

    SELECT COALESCE(MAX(sort_order), 0) + 1 INTO next_no
      FROM visa_document_items WHERE visa_id = p_visa_id;

    INSERT INTO visa_document_items (
        visa_id, document_name, status, sort_order, note, is_custom, added_by_staff_id
    ) VALUES (
        p_visa_id, btrim(p_name), 'pending', next_no, p_note, TRUE, me
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END $fn$;

REVOKE ALL ON FUNCTION staff_add_visa_document(UUID, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION staff_add_visa_document(UUID, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Remove one.
--
-- Refuses while a file is attached. Deleting the row would strand the student's
-- upload in the bucket with nothing pointing at it — unreachable, unauditable,
-- and still holding their passport. The caller must clear the file first, which
-- the CRM does through the Storage API before calling this.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION staff_remove_visa_document(p_doc_id UUID)
RETURNS VOID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    doc visa_document_items%ROWTYPE;
BEGIN
    IF NOT is_staff() THEN RAISE EXCEPTION 'staff only'; END IF;

    SELECT * INTO doc FROM visa_document_items WHERE id = p_doc_id;
    IF doc.id IS NULL THEN RAISE EXCEPTION 'no such document'; END IF;

    IF doc.file_url IS NOT NULL THEN
        RAISE EXCEPTION
          'The student has uploaded a file for this. Remove the file first, or mark it Not needed instead.';
    END IF;

    DELETE FROM visa_document_items WHERE id = p_doc_id;
END $fn$;

REVOKE ALL ON FUNCTION staff_remove_visa_document(UUID) FROM public;
GRANT EXECUTE ON FUNCTION staff_remove_visa_document(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- The portal already reads visa_document_items through the 0008 policy, but it
-- selects an explicit column list. Nothing to change in RLS — only the columns
-- the client asks for.
-- =====================================================
-- DONE.
-- =====================================================
