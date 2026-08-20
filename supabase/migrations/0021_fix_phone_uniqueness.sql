-- =====================================================
-- NextUp Mentor — Fix: "that time was just taken" on a free slot
-- Migration 0021. Idempotent.
--
-- THE BUG
--   `idx_appointments_phone` was a UNIQUE index across the whole appointments
--   table. It exists for the PUBLIC /book form, where one phone number booking
--   repeatedly is spam.
--
--   Portal and staff bookings write `COALESCE(client.whatsapp, '')` into that
--   column. Any client without a WhatsApp number therefore writes the empty
--   string — and the SECOND such booking collides with the first. The slot was
--   free; the phone number was ''.
--
--   Worse, the collision surfaced as "that time was just taken", because the
--   booking functions treated every unique_violation as a double-booking. A
--   correct guard with a wrong error message sent the student to pick another
--   time, which then failed identically.
--
-- THE FIX
--   1. Scope phone uniqueness to what it was actually for: anonymous public
--      bookings with a real number. A booking attached to a client record is
--      already identified by that record.
--   2. Make the booking functions name the constraint that actually failed, so
--      the next mismatch of this kind reports itself honestly.
-- =====================================================

-- ---------------------------------------------------------------------------
-- 1. Narrow the index.
--    Applies only to public bookings (no client record) with a real number.
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_appointments_phone;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_phone_public
    ON appointments (phone)
    WHERE client_id IS NULL AND phone <> '';

-- Still worth an ordinary index: the public form looks a number up on submit.
CREATE INDEX IF NOT EXISTS idx_appointments_phone_lookup ON appointments (phone);

-- ---------------------------------------------------------------------------
-- 2. Tell the truth about which collision happened.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal_book_meeting(
    p_mentor_id  UUID,
    p_starts_at  TIMESTAMPTZ
) RETURNS UUID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    uid       UUID := auth.uid();
    my_client clients%ROWTYPE;
    slot_ok   BOOLEAN;
    appt_id   UUID;
    slot_end  TIME;
BEGIN
    IF uid IS NULL THEN RAISE EXCEPTION 'must be signed in'; END IF;

    SELECT * INTO my_client FROM clients WHERE auth_user_id = uid;
    IF my_client.id IS NULL THEN RAISE EXCEPTION 'no file for this account'; END IF;

    SELECT TRUE, s.slot_end INTO slot_ok, slot_end
      FROM portal_available_slots(60) s
     WHERE s.mentor_id = p_mentor_id AND s.starts_at = p_starts_at
     LIMIT 1;

    IF NOT COALESCE(slot_ok, FALSE) THEN
        RAISE EXCEPTION 'that time is no longer available';
    END IF;

    INSERT INTO appointments (
        name, phone, email, interest, preferred_mentor_id, assigned_mentor_id,
        weekday, slot_start, slot_end, scheduled_at, status, client_id, notes
    ) VALUES (
        my_client.full_name,
        COALESCE(my_client.whatsapp, ''),
        my_client.email,
        array_to_string(my_client.country_interest, ', '),
        p_mentor_id, p_mentor_id,
        EXTRACT(DOW FROM (p_starts_at AT TIME ZONE 'Asia/Dhaka'))::INT,
        (p_starts_at AT TIME ZONE 'Asia/Dhaka')::TIME,
        slot_end, p_starts_at, 'assigned', my_client.id,
        'Booked by the student from the portal.'
    )
    RETURNING id INTO appt_id;

    INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, status, comments)
    VALUES (my_client.id, p_starts_at, p_mentor_id, 'scheduled',
            'First consultation, booked by the student.');

    UPDATE clients
       SET primary_consultant_id = COALESCE(primary_consultant_id, p_mentor_id),
           stage = CASE WHEN stage = 'lead' THEN 'meeting'::client_stage ELSE stage END,
           updated_at = now()
     WHERE id = my_client.id;

    RETURN appt_id;
EXCEPTION
    WHEN unique_violation THEN
        -- Only the double-booking index means the slot went. Anything else is a
        -- different problem and must not be reported as one, or the student is
        -- told to pick another time and hits the same wall.
        IF SQLERRM ILIKE '%no_double_book%' THEN
            RAISE EXCEPTION 'that time was just taken — please pick another';
        END IF;
        RAISE EXCEPTION 'Could not save the booking (%). Please tell your consultant.', SQLERRM;
END $fn$;

REVOKE ALL ON FUNCTION portal_book_meeting(UUID, TIMESTAMPTZ) FROM public;
GRANT EXECUTE ON FUNCTION portal_book_meeting(UUID, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION staff_book_meeting(
    p_client_id UUID,
    p_mentor_id UUID,
    p_starts_at TIMESTAMPTZ,
    p_note      TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    me         UUID := current_staff_id();
    the_client clients%ROWTYPE;
    slot_end   TIME;
    slot_ok    BOOLEAN;
    appt_id    UUID;
BEGIN
    IF me IS NULL OR NOT is_staff() THEN RAISE EXCEPTION 'staff only'; END IF;

    SELECT * INTO the_client FROM clients WHERE id = p_client_id;
    IF the_client.id IS NULL THEN RAISE EXCEPTION 'that client no longer exists'; END IF;

    IF NOT EXISTS (
        SELECT 1 FROM staff WHERE id = p_mentor_id AND status = 'active' AND is_mentor
    ) THEN
        RAISE EXCEPTION 'that person is not a mentor';
    END IF;

    SELECT TRUE, s.slot_end INTO slot_ok, slot_end
      FROM portal_available_slots(60) s
     WHERE s.mentor_id = p_mentor_id AND s.starts_at = p_starts_at
     LIMIT 1;

    IF NOT COALESCE(slot_ok, FALSE) THEN
        RAISE EXCEPTION 'that time is not free';
    END IF;

    INSERT INTO appointments (
        name, phone, email, interest, preferred_mentor_id, assigned_mentor_id,
        weekday, slot_start, slot_end, scheduled_at, status, client_id, notes
    ) VALUES (
        the_client.full_name,
        COALESCE(the_client.whatsapp, ''),
        the_client.email,
        array_to_string(the_client.country_interest, ', '),
        p_mentor_id, p_mentor_id,
        EXTRACT(DOW FROM (p_starts_at AT TIME ZONE 'Asia/Dhaka'))::INT,
        (p_starts_at AT TIME ZONE 'Asia/Dhaka')::TIME,
        slot_end, p_starts_at, 'assigned', the_client.id,
        COALESCE(p_note, 'Booked by staff on the client''s behalf.')
    )
    RETURNING id INTO appt_id;

    INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, forwarded_by_staff_id, status, comments)
    VALUES (the_client.id, p_starts_at, p_mentor_id, me, 'scheduled',
            COALESCE(p_note, 'Consultation booked by staff.'));

    UPDATE clients
       SET primary_consultant_id = COALESCE(primary_consultant_id, p_mentor_id),
           added_by_staff_id     = COALESCE(added_by_staff_id, me),
           stage = CASE WHEN stage = 'lead' THEN 'meeting'::client_stage ELSE stage END,
           updated_at = now()
     WHERE id = the_client.id;

    RETURN appt_id;
EXCEPTION
    WHEN unique_violation THEN
        IF SQLERRM ILIKE '%no_double_book%' THEN
            RAISE EXCEPTION 'that time was just taken — please pick another';
        END IF;
        RAISE EXCEPTION 'Could not save the booking (%).', SQLERRM;
END $fn$;

REVOKE ALL ON FUNCTION staff_book_meeting(UUID, UUID, TIMESTAMPTZ, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION staff_book_meeting(UUID, UUID, TIMESTAMPTZ, TEXT) TO authenticated;

-- =====================================================
-- DONE.
-- =====================================================
