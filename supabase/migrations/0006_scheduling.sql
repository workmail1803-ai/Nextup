-- =====================================================
-- NextUp Mentor — Scheduling & public appointments
-- Migration 0006 (ADDITIVE). Idempotent. Run after 0001–0005.
--
-- Adds: mentor weekly availability, public free-appointment bookings,
-- "forwarded by" attribution on clients + meetings, and the SSC/HSC/IELTS
-- academic columns referenced by the client types.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- clients: forwarded-by + academic fields --------------------------------
ALTER TABLE clients ADD COLUMN IF NOT EXISTS added_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ssc_result  VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ssc_year    SMALLINT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hsc_result  VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hsc_year    SMALLINT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ielts_score NUMERIC(3,1);

CREATE INDEX IF NOT EXISTS idx_clients_added_by ON clients (added_by_staff_id);

-- ---- client_meetings: forwarded-by ------------------------------------------
ALTER TABLE client_meetings ADD COLUMN IF NOT EXISTS forwarded_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_meetings_forwarded_by ON client_meetings (forwarded_by_staff_id);

-- =====================================================
-- STAFF AVAILABILITY  (recurring weekly slots per mentor)
-- weekday: 0 = Sunday … 6 = Saturday (JS getDay convention)
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_availability (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id   UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    weekday    SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time   TIME NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_avail_staff        ON staff_availability (staff_id);
CREATE INDEX IF NOT EXISTS idx_avail_staff_day    ON staff_availability (staff_id, weekday);
CREATE INDEX IF NOT EXISTS idx_avail_active       ON staff_availability (is_active) WHERE is_active = TRUE;
-- Prevent exact duplicate slots for a mentor.
CREATE UNIQUE INDEX IF NOT EXISTS idx_avail_unique ON staff_availability (staff_id, weekday, start_time, end_time);

-- =====================================================
-- APPOINTMENTS  (public free bookings — no login)
-- =====================================================
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending','assigned','confirmed','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS appointments (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name               VARCHAR(200) NOT NULL,
    phone              VARCHAR(40) NOT NULL,
    email              VARCHAR(255),
    interest           TEXT,                       -- what they want to study / country
    preferred_mentor_id UUID REFERENCES staff(id) ON DELETE SET NULL,  -- NULL = any mentor (pool)
    assigned_mentor_id  UUID REFERENCES staff(id) ON DELETE SET NULL,  -- who is handling it
    weekday            SMALLINT CHECK (weekday IS NULL OR weekday BETWEEN 0 AND 6),
    slot_start         TIME,
    slot_end           TIME,
    scheduled_at       TIMESTAMPTZ,                -- concrete confirmed date/time
    status             appointment_status NOT NULL DEFAULT 'pending',
    notes              TEXT,
    client_id          UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Phone must be unique (one active booking per number). Case-insensitive-safe
-- via the raw digits is overkill here — enforce on the stored value.
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_phone     ON appointments (phone);
CREATE INDEX IF NOT EXISTS idx_appointments_preferred ON appointments (preferred_mentor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned  ON appointments (assigned_mentor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status    ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_created   ON appointments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments (scheduled_at);

-- =====================================================
-- updated_at triggers
-- =====================================================
DROP TRIGGER IF EXISTS staff_availability_updated_at ON staff_availability;
CREATE TRIGGER staff_availability_updated_at BEFORE UPDATE ON staff_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS appointments_updated_at ON appointments;
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- RLS (permissive dev — public can read availability/staff + insert appointments)
-- =====================================================
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for staff_availability" ON staff_availability;
CREATE POLICY "Allow all for staff_availability" ON staff_availability FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for appointments" ON appointments;
CREATE POLICY "Allow all for appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Realtime
-- =====================================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE staff_availability; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE appointments; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- SEED — demo availability for the 3 consultants (Sat/Sun/Mon 17:00–18:00)
-- weekday: 0=Sun, 1=Mon, 6=Sat
-- =====================================================
INSERT INTO staff_availability (staff_id, weekday, start_time, end_time)
SELECT s.id, d.weekday, TIME '17:00', TIME '18:00'
FROM staff s
CROSS JOIN (VALUES (6), (0), (1)) AS d(weekday)
WHERE upper(s.staff_code) IN ('NX-2001','NX-2002','NX-2003')
  AND NOT EXISTS (
    SELECT 1 FROM staff_availability a
    WHERE a.staff_id = s.id AND a.weekday = d.weekday
      AND a.start_time = TIME '17:00' AND a.end_time = TIME '18:00'
  );
