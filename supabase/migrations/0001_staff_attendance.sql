-- =====================================================
-- NextUp Mentor — Staff Portal & Attendance
-- Migration 0001 (ADDITIVE). Run in the Supabase SQL editor.
-- Safe to re-run: all statements are idempotent.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. STAFF
-- =====================================================
DO $$ BEGIN
  CREATE TYPE staff_status AS ENUM ('active', 'disabled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS staff (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name     VARCHAR(200) NOT NULL,
    staff_code    VARCHAR(40)  NOT NULL,
    title         VARCHAR(120),
    avatar_url    TEXT,
    status        staff_status NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Codes are case-insensitively unique (staff type "nx-4821" or "NX-4821").
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_code   ON staff (upper(staff_code));
CREATE INDEX        IF NOT EXISTS idx_staff_status ON staff (status);

-- =====================================================
-- 2. ATTENDANCE SESSIONS
-- =====================================================
DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('working', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id         UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    work_date        DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'utc')::date),
    start_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_at           TIMESTAMPTZ,
    status           attendance_status NOT NULL DEFAULT 'working',
    duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
    note             TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_staff  ON attendance_sessions (staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date   ON attendance_sessions (work_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_sessions (status);

-- Composite index for the hot path: one staff member's history, newest first
-- (AttendanceService.historyForStaff / summaries).
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date
    ON attendance_sessions (staff_id, work_date DESC, start_at DESC);

-- Enforce at most ONE open ("working") session per staff member.
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_one_open
    ON attendance_sessions (staff_id) WHERE status = 'working';

-- =====================================================
-- 3. UPDATED_AT TRIGGERS (reuse shared function)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS staff_updated_at ON staff;
CREATE TRIGGER staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS attendance_updated_at ON attendance_sessions;
CREATE TRIGGER attendance_updated_at
    BEFORE UPDATE ON attendance_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 4. ROW LEVEL SECURITY — DEVELOPMENT (PERMISSIVE)
--    Matches the existing schema.sql posture. Tighten before production.
-- =====================================================
ALTER TABLE staff               ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for staff" ON staff;
CREATE POLICY "Allow all for staff" ON staff
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for attendance" ON attendance_sessions;
CREATE POLICY "Allow all for attendance" ON attendance_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 5. REALTIME — add tables to the supabase_realtime publication
-- =====================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sessions;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE staff;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- DONE. Run 0002_seed_demo.sql next for demo data (optional).
-- =====================================================
