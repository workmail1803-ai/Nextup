-- =====================================================
-- NextUp Mentor — Mentors as a capability, and protected schedules
-- Migration 0019 (ADDITIVE). Idempotent.
--
-- WHY A FLAG, NOT A ROLE: `role` answers "what may you administer" (admin vs
-- staff). Mentoring is orthogonal — an admin may well take consultations, and a
-- staff member handling documents may never take one. Folding it into the role
-- enum would force a false choice and break the finance gating, which keys off
-- admin. So: `is_mentor`, set by an admin, independent of role.
--
-- THE RULE THAT MATTERS: a mentor may edit their own schedule, but NOT a window
-- a student has already booked into. Enforced in the database, because the CRM
-- is not the only thing that can issue an UPDATE.
-- =====================================================

-- ---------------------------------------------------------------------------
-- 1. The flag
-- ---------------------------------------------------------------------------
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_mentor BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial: every mentor lookup asks "who are the mentors", never "who isn't".
CREATE INDEX IF NOT EXISTS idx_staff_is_mentor ON staff (is_mentor) WHERE is_mentor;

-- ---------------------------------------------------------------------------
-- 2. Students only ever see actual mentors.
--    public_mentors is what the portal and the public booking page read.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public_mentors AS
    SELECT id, full_name, title, avatar_url
      FROM staff
     WHERE status = 'active'
       AND is_mentor;

GRANT SELECT ON public_mentors TO authenticated, anon;

-- Slot generation must agree, or a non-mentor's calendar would still be
-- bookable even though they never appear in the list.
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
        s.id, s.full_name::TEXT, s.title::TEXT, s.avatar_url::TEXT,
        d::DATE, a.start_time, a.end_time,
        ((d::DATE + a.start_time) AT TIME ZONE 'Asia/Dhaka')
    FROM generate_series(
             CURRENT_DATE,
             CURRENT_DATE + LEAST(GREATEST(p_days_ahead, 1), 60),
             INTERVAL '1 day'
         ) AS d
    JOIN staff_availability a
      ON a.weekday = EXTRACT(DOW FROM d)::INT AND a.is_active
    JOIN staff s
      ON s.id = a.staff_id AND s.status = 'active' AND s.is_mentor
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
-- 3. Is this window spoken for?
--
--    An availability row is a recurring weekly window, so it has no single
--    booking. It is "spoken for" if any FUTURE appointment falls on its weekday
--    at its start time and is still live. Past meetings do not lock a schedule
--    forever — otherwise a mentor could never change their hours again.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION availability_booking_count(p_avail_id UUID)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT COUNT(*)::INT
      FROM staff_availability a
      JOIN appointments ap
        ON ap.assigned_mentor_id = a.staff_id
       AND ap.status IN ('pending', 'assigned', 'confirmed')
       AND ap.scheduled_at > now()
       AND EXTRACT(DOW FROM (ap.scheduled_at AT TIME ZONE 'Asia/Dhaka'))::INT = a.weekday
       AND (ap.scheduled_at AT TIME ZONE 'Asia/Dhaka')::TIME = a.start_time
     WHERE a.id = p_avail_id;
$fn$;

REVOKE ALL ON FUNCTION availability_booking_count(UUID) FROM public;
GRANT EXECUTE ON FUNCTION availability_booking_count(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. The guard. A trigger, not a check in the UI — a mentor could otherwise
--    lose a student's booked call through the API, a script, or a stale tab.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION protect_booked_availability() RETURNS TRIGGER
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    booked INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        booked := availability_booking_count(OLD.id);
        IF booked > 0 THEN
            RAISE EXCEPTION
              'This time has % booked consultation(s). Cancel or move them before removing it.', booked;
        END IF;
        RETURN OLD;
    END IF;

    -- Only the parts that change what a student was promised are protected.
    -- Anything else about the row stays freely editable.
    IF NEW.weekday IS DISTINCT FROM OLD.weekday
       OR NEW.start_time IS DISTINCT FROM OLD.start_time
       OR NEW.end_time IS DISTINCT FROM OLD.end_time
       OR (OLD.is_active AND NOT NEW.is_active)
    THEN
        booked := availability_booking_count(OLD.id);
        IF booked > 0 THEN
            RAISE EXCEPTION
              'This time has % booked consultation(s). Cancel or move them before changing it.', booked;
        END IF;
    END IF;

    RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_protect_booked_availability ON staff_availability;
CREATE TRIGGER trg_protect_booked_availability
    BEFORE UPDATE OR DELETE ON staff_availability
    FOR EACH ROW EXECUTE FUNCTION protect_booked_availability();

-- ---------------------------------------------------------------------------
-- 5. Who may touch a schedule.
--    Was: any staff member could edit anyone's. Now: your own, or admin.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "avail staff authed"  ON staff_availability;
DROP POLICY IF EXISTS "avail own"           ON staff_availability;
DROP POLICY IF EXISTS "avail admin"         ON staff_availability;
DROP POLICY IF EXISTS "avail read authed"   ON staff_availability;

-- Everyone signed in can READ schedules — the CRM shows who is free when.
CREATE POLICY "avail read authed" ON staff_availability
    FOR SELECT TO authenticated USING (is_staff());

-- A mentor writes only their own.
CREATE POLICY "avail own" ON staff_availability
    FOR ALL TO authenticated
    USING (staff_id = current_staff_id())
    WITH CHECK (staff_id = current_staff_id());

-- An admin writes anyone's.
CREATE POLICY "avail admin" ON staff_availability
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 6. A mentor's own upcoming consultations, with the client attached.
--    One call for the CRM screen instead of three round-trips and a join in JS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mentor_upcoming_meetings(p_days_ahead INT DEFAULT 30)
RETURNS TABLE (
    appointment_id UUID,
    client_id      UUID,
    client_name    TEXT,
    client_email   TEXT,
    client_whatsapp TEXT,
    client_stage   TEXT,
    countries      TEXT[],
    scheduled_at   TIMESTAMPTZ,
    status         TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT
        ap.id, c.id, c.full_name::TEXT, c.email::TEXT, c.whatsapp::TEXT,
        c.stage::TEXT, c.country_interest, ap.scheduled_at, ap.status::TEXT
      FROM appointments ap
      LEFT JOIN clients c ON c.id = ap.client_id
     WHERE ap.assigned_mentor_id = current_staff_id()
       AND ap.scheduled_at IS NOT NULL
       AND ap.scheduled_at > now() - INTERVAL '2 hours'
       AND ap.scheduled_at < now() + (LEAST(GREATEST(p_days_ahead, 1), 180) || ' days')::INTERVAL
       AND ap.status IN ('pending', 'assigned', 'confirmed')
     ORDER BY ap.scheduled_at;
$fn$;

REVOKE ALL ON FUNCTION mentor_upcoming_meetings(INT) FROM public;
GRANT EXECUTE ON FUNCTION mentor_upcoming_meetings(INT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Seed: the two existing staff are currently the only possible mentors, and
--    the portal booking flow already depends on them. Without this the mentor
--    list empties the moment this migration lands. Admin can untick either.
-- ---------------------------------------------------------------------------
UPDATE staff SET is_mentor = TRUE WHERE status = 'active' AND is_mentor = FALSE;

-- =====================================================
-- DONE.
-- =====================================================
