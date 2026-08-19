-- =====================================================
-- NextUp Mentor — Staff book consultations on a client's behalf
-- Migration 0020 (ADDITIVE). Idempotent.
--
-- Most students in this business arrive by WhatsApp or a walk-in, not through
-- the portal. A staff member takes the details and books the call for them. So
-- booking cannot be a portal-only capability.
--
-- WHO CAN DO WHAT:
--   any staff (mentor or not) may book a client with any MENTOR
--   only admins decide who is a mentor (migration 0019)
--   a non-mentor can therefore fill a mentor's diary but never appear in it
--
-- ALSO HERE: cancellation. 0019 locks an availability window while a booking
-- sits on it and tells the mentor to "cancel or move it first" — which was
-- advice with no button behind it. staff_cancel_meeting() is that button, and
-- cancelling releases the slot because the uniqueness guard and the free-slot
-- query both ignore cancelled rows.
-- =====================================================

-- ---------------------------------------------------------------------------
-- 1. Book a client in.
--
--    Mirrors portal_book_meeting, but the client is named by the caller rather
--    than taken from the JWT — so it re-checks that the caller is staff, and
--    that the target really is a bookable mentor.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION staff_book_meeting(
    p_client_id UUID,
    p_mentor_id UUID,
    p_starts_at TIMESTAMPTZ,
    p_note      TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    me        UUID := current_staff_id();
    the_client clients%ROWTYPE;
    slot_end  TIME;
    slot_ok   BOOLEAN;
    appt_id   UUID;
BEGIN
    IF me IS NULL OR NOT is_staff() THEN
        RAISE EXCEPTION 'staff only';
    END IF;

    SELECT * INTO the_client FROM clients WHERE id = p_client_id;
    IF the_client.id IS NULL THEN
        RAISE EXCEPTION 'that client no longer exists';
    END IF;

    -- Only a mentor can be booked. A staff member who is not a mentor may make
    -- the booking, but cannot be its subject.
    IF NOT EXISTS (
        SELECT 1 FROM staff
         WHERE id = p_mentor_id AND status = 'active' AND is_mentor
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
        p_mentor_id,
        p_mentor_id,
        EXTRACT(DOW FROM (p_starts_at AT TIME ZONE 'Asia/Dhaka'))::INT,
        (p_starts_at AT TIME ZONE 'Asia/Dhaka')::TIME,
        slot_end,
        p_starts_at,
        'assigned',
        the_client.id,
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
        RAISE EXCEPTION 'that time was just taken — please pick another';
END $fn$;

REVOKE ALL ON FUNCTION staff_book_meeting(UUID, UUID, TIMESTAMPTZ, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION staff_book_meeting(UUID, UUID, TIMESTAMPTZ, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Cancel one — which is what releases a locked availability window.
--
--    The row is marked cancelled rather than deleted: a student who was told a
--    time and then had it withdrawn is a fact worth keeping, and the partial
--    unique index already excludes cancelled rows, so the slot frees itself.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION staff_cancel_meeting(
    p_appointment_id UUID,
    p_reason         TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    ap appointments%ROWTYPE;
BEGIN
    IF NOT is_staff() THEN RAISE EXCEPTION 'staff only'; END IF;

    SELECT * INTO ap FROM appointments WHERE id = p_appointment_id;
    IF ap.id IS NULL THEN RAISE EXCEPTION 'no such booking'; END IF;

    UPDATE appointments
       SET status = 'cancelled',
           notes = COALESCE(notes, '') ||
                   CASE WHEN p_reason IS NULL THEN '' ELSE E'\nCancelled: ' || p_reason END,
           updated_at = now()
     WHERE id = p_appointment_id;

    -- Keep the client's own meeting list honest — the portal reads that table,
    -- not the booking queue, so leaving it would show a meeting that is off.
    UPDATE client_meetings
       SET status = 'cancelled', updated_at = now()
     WHERE client_id = ap.client_id
       AND scheduled_at = ap.scheduled_at
       AND status = 'scheduled';
END $fn$;

REVOKE ALL ON FUNCTION staff_cancel_meeting(UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION staff_cancel_meeting(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. The mentor list staff pick from. Same source the students see, so the two
--    can never drift apart.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION bookable_mentors()
RETURNS TABLE (id UUID, full_name TEXT, title TEXT, avatar_url TEXT, open_slots INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT m.id, m.full_name::TEXT, m.title::TEXT, m.avatar_url::TEXT,
           (SELECT COUNT(*)::INT FROM portal_available_slots(21) s WHERE s.mentor_id = m.id)
      FROM public_mentors m
     ORDER BY m.full_name;
$fn$;

REVOKE ALL ON FUNCTION bookable_mentors() FROM public;
GRANT EXECUTE ON FUNCTION bookable_mentors() TO authenticated;

-- =====================================================
-- DONE.
-- =====================================================
