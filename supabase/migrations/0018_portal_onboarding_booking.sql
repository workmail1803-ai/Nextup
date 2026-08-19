-- =====================================================
-- NextUp Mentor — Portal onboarding + mentor booking
-- Migration 0018 (ADDITIVE). Idempotent.
--
-- Turns the portal's dead end into the funnel: a Google account with no file
-- answers a few questions, picks a mentor, books a slot, and becomes a lead.
--
-- THREE ENTRY POINTS, all SECURITY DEFINER, because a student has no direct
-- write access to `clients` or `appointments` and should not get any:
--   portal_create_file()      one file per Google account, stage 'lead'
--   portal_available_slots()  concrete dated slots that are actually free
--   portal_book_meeting()     books one, atomically
--
-- ON DOUBLE-BOOKING: `staff_availability` describes a RECURRING WEEKLY window,
-- so "Saturday 17:00" is not a booking — it repeats forever and two students
-- could each take it. Slots are therefore projected onto real dates here, and a
-- partial unique index makes the collision impossible at the database rather
-- than hoping two concurrent requests don't interleave.
--
-- TIMEZONE: availability times are wall-clock Asia/Dhaka. Stored instants are
-- timestamptz. The conversion happens in one place, below, so a mentor typing
-- "17:00" gets 17:00 in Dhaka regardless of where the server or student is.
-- =====================================================

-- ---------------------------------------------------------------------------
-- 1. Make double-booking impossible.
--    Partial, so cancelled appointments free the slot again.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_book
    ON appointments (assigned_mentor_id, scheduled_at)
    WHERE assigned_mentor_id IS NOT NULL
      AND scheduled_at IS NOT NULL
      AND status IN ('pending', 'assigned', 'confirmed');

-- The portal reads "my appointments" and staff read the queue by mentor+time.
CREATE INDEX IF NOT EXISTS idx_appointments_client   ON appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_mentor_time
    ON appointments (assigned_mentor_id, scheduled_at);

-- ---------------------------------------------------------------------------
-- 2. Create a file for a signed-in visitor who has none.
--
--    The email is taken from the JWT, never from the form — otherwise a visitor
--    could type a real student's address and claim their file.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal_create_file(
    p_full_name  TEXT,
    p_countries  TEXT[] DEFAULT NULL,
    p_degree     TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    uid        UUID := auth.uid();
    caller_email TEXT := auth.email();
    existing   UUID;
    new_id     UUID;
BEGIN
    IF uid IS NULL OR caller_email IS NULL THEN
        RAISE EXCEPTION 'must be signed in';
    END IF;
    IF p_full_name IS NULL OR length(btrim(p_full_name)) < 2 THEN
        RAISE EXCEPTION 'please enter your name';
    END IF;

    -- Already has a file (either bound, or matching by email)? Return it.
    -- Makes the call idempotent, so a double-tap cannot create two files.
    SELECT id INTO existing FROM clients
     WHERE auth_user_id = uid
        OR (email IS NOT NULL AND lower(email) = lower(caller_email))
     LIMIT 1;
    IF existing IS NOT NULL THEN
        UPDATE clients SET auth_user_id = uid WHERE id = existing AND auth_user_id IS NULL;
        RETURN existing;
    END IF;

    INSERT INTO clients (
        full_name, email, auth_user_id, stage, country_interest, degree, notes
    ) VALUES (
        btrim(p_full_name),
        caller_email,
        uid,
        'lead',
        COALESCE(p_countries, ARRAY[]::TEXT[]),
        CASE WHEN p_degree IN ('bachelors', 'masters') THEN p_degree::degree_level ELSE NULL END,
        'Self-registered through the student portal.'
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END $fn$;

REVOKE ALL ON FUNCTION portal_create_file(TEXT, TEXT[], TEXT) FROM public;
GRANT EXECUTE ON FUNCTION portal_create_file(TEXT, TEXT[], TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Free slots, as real dates.
--
--    Projects each recurring weekly window onto the next N calendar days, drops
--    anything already taken, and drops anything too soon to be useful — nobody
--    wants a booking alert for a call starting in ten minutes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal_available_slots(p_days_ahead INT DEFAULT 21)
RETURNS TABLE (
    mentor_id     UUID,
    mentor_name   TEXT,
    mentor_title  TEXT,
    mentor_avatar TEXT,
    slot_date     DATE,
    slot_start    TIME,
    slot_end      TIME,
    starts_at     TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT
        s.id,
        s.full_name::TEXT,
        s.title::TEXT,
        s.avatar_url::TEXT,
        d::DATE,
        a.start_time,
        a.end_time,
        ((d::DATE + a.start_time) AT TIME ZONE 'Asia/Dhaka')
    FROM generate_series(
             CURRENT_DATE,
             CURRENT_DATE + LEAST(GREATEST(p_days_ahead, 1), 60),
             INTERVAL '1 day'
         ) AS d
    JOIN staff_availability a
      ON a.weekday = EXTRACT(DOW FROM d)::INT
     AND a.is_active
    JOIN staff s
      ON s.id = a.staff_id
     AND s.status = 'active'
    WHERE ((d::DATE + a.start_time) AT TIME ZONE 'Asia/Dhaka') > now() + INTERVAL '3 hours'
      AND NOT EXISTS (
          SELECT 1 FROM appointments ap
           WHERE ap.assigned_mentor_id = s.id
             AND ap.scheduled_at = ((d::DATE + a.start_time) AT TIME ZONE 'Asia/Dhaka')
             AND ap.status IN ('pending', 'assigned', 'confirmed')
      )
    ORDER BY d, a.start_time, s.full_name;
$fn$;

REVOKE ALL ON FUNCTION portal_available_slots(INT) FROM public;
GRANT EXECUTE ON FUNCTION portal_available_slots(INT) TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- 4. Book one.
--
--    Re-derives everything from the mentor and the instant — the client comes
--    from the JWT, and the slot is re-checked against real availability. A
--    caller cannot book a time the mentor never offered by posting their own.
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

    -- Is this genuinely a slot this mentor offers, and still free?
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
        p_mentor_id,
        p_mentor_id,
        EXTRACT(DOW FROM (p_starts_at AT TIME ZONE 'Asia/Dhaka'))::INT,
        (p_starts_at AT TIME ZONE 'Asia/Dhaka')::TIME,
        slot_end,
        p_starts_at,
        'assigned',
        my_client.id,
        'Booked by the student from the portal.'
    )
    RETURNING id INTO appt_id;

    -- Mirror it into client_meetings so it appears on the portal's Meetings tab
    -- and in the CRM, which both read meetings rather than the booking queue.
    INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, status, comments)
    VALUES (my_client.id, p_starts_at, p_mentor_id, 'scheduled',
            'First consultation, booked by the student.');

    -- First mentor booked becomes the consultant, and the file moves off 'lead'.
    -- The stage trigger from 0014 records that transition automatically.
    UPDATE clients
       SET primary_consultant_id = COALESCE(primary_consultant_id, p_mentor_id),
           stage = CASE WHEN stage = 'lead' THEN 'meeting'::client_stage ELSE stage END,
           updated_at = now()
     WHERE id = my_client.id;

    RETURN appt_id;
EXCEPTION
    WHEN unique_violation THEN
        -- Someone took the same slot between the check above and the insert.
        RAISE EXCEPTION 'that time was just taken — please pick another';
END $fn$;

REVOKE ALL ON FUNCTION portal_book_meeting(UUID, TIMESTAMPTZ) FROM public;
GRANT EXECUTE ON FUNCTION portal_book_meeting(UUID, TIMESTAMPTZ) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Let a student read their own appointments (the Meetings tab).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "appointments portal select" ON appointments;
CREATE POLICY "appointments portal select" ON appointments
    FOR SELECT TO authenticated
    USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));

-- Destinations already allow anon SELECT (0013); the onboarding step reads them
-- so the country list is whatever an admin has configured, not a hardcoded array.
DROP POLICY IF EXISTS "destinations authed read" ON destinations;
CREATE POLICY "destinations authed read" ON destinations
    FOR SELECT TO authenticated USING (true);

-- =====================================================
-- DONE.
-- =====================================================
