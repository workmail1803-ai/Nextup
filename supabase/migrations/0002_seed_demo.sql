-- =====================================================
-- NextUp Mentor — Demo seed for Staff Portal & Attendance
-- Run AFTER 0001_staff_attendance.sql. Optional (demo data only).
-- Idempotent: guarded by staff_code / work_date existence checks.
--
-- Demo staff codes (share with testers):
--   Rakib Ahmed Rizbe  -> NX-4821   (has attendance history)
--   Sadia Islam        -> NX-3390
--   Tanvir Hasan       -> NX-5027
-- =====================================================

-- ---- Staff -----------------------------------------------------------
INSERT INTO staff (full_name, staff_code, title, status)
SELECT 'Rakib Ahmed Rizbe', 'NX-4821', 'Student Counsellor', 'active'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE upper(staff_code) = 'NX-4821');

INSERT INTO staff (full_name, staff_code, title, status)
SELECT 'Sadia Islam', 'NX-3390', 'Visa Specialist', 'active'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE upper(staff_code) = 'NX-3390');

INSERT INTO staff (full_name, staff_code, title, status)
SELECT 'Tanvir Hasan', 'NX-5027', 'Admissions Lead', 'active'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE upper(staff_code) = 'NX-5027');

-- ---- Attendance history for Rakib (from the real attendance sheet) ----
WITH s AS (
    SELECT id FROM staff WHERE upper(staff_code) = 'NX-4821' LIMIT 1
),
rows(work_date, start_ts, hrs) AS (
    VALUES
        -- June 2026 (history)
        (DATE '2026-06-02', TIMESTAMPTZ '2026-06-02 11:00+06', 2.0),
        (DATE '2026-06-03', TIMESTAMPTZ '2026-06-03 22:30+06', 2.5),
        (DATE '2026-06-04', TIMESTAMPTZ '2026-06-04 11:00+06', 2.0),
        (DATE '2026-06-06', TIMESTAMPTZ '2026-06-06 11:00+06', 2.0),
        (DATE '2026-06-08', TIMESTAMPTZ '2026-06-08 11:00+06', 2.0),
        (DATE '2026-06-09', TIMESTAMPTZ '2026-06-09 11:00+06', 2.0),
        (DATE '2026-06-10', TIMESTAMPTZ '2026-06-10 11:00+06', 2.0),
        (DATE '2026-06-11', TIMESTAMPTZ '2026-06-11 11:00+06', 2.0),
        (DATE '2026-06-12', TIMESTAMPTZ '2026-06-12 11:30+06', 2.5),
        (DATE '2026-06-13', TIMESTAMPTZ '2026-06-13 11:30+06', 2.0),
        (DATE '2026-06-15', TIMESTAMPTZ '2026-06-15 11:00+06', 1.0),
        (DATE '2026-06-16', TIMESTAMPTZ '2026-06-16 11:00+06', 1.0),
        (DATE '2026-06-17', TIMESTAMPTZ '2026-06-17 11:00+06', 1.0),
        (DATE '2026-06-18', TIMESTAMPTZ '2026-06-18 10:30+06', 2.0),
        (DATE '2026-06-19', TIMESTAMPTZ '2026-06-19 15:30+06', 5.0),
        (DATE '2026-06-20', TIMESTAMPTZ '2026-06-20 10:30+06', 1.5),
        (DATE '2026-06-21', TIMESTAMPTZ '2026-06-21 10:00+06', 2.0),
        (DATE '2026-06-22', TIMESTAMPTZ '2026-06-22 10:20+06', 2.0),
        (DATE '2026-06-25', TIMESTAMPTZ '2026-06-25 10:30+06', 2.0),
        (DATE '2026-06-26', TIMESTAMPTZ '2026-06-26 10:00+06', 2.0),
        (DATE '2026-06-27', TIMESTAMPTZ '2026-06-27 10:00+06', 2.0),
        (DATE '2026-06-28', TIMESTAMPTZ '2026-06-28 08:30+06', 3.0),
        -- July 2026 (recent — populates this-week / this-month)
        (DATE '2026-07-01', TIMESTAMPTZ '2026-07-01 10:00+06', 2.5),
        (DATE '2026-07-02', TIMESTAMPTZ '2026-07-02 10:15+06', 3.0),
        (DATE '2026-07-03', TIMESTAMPTZ '2026-07-03 09:45+06', 2.0),
        (DATE '2026-07-04', TIMESTAMPTZ '2026-07-04 10:30+06', 2.5)
)
INSERT INTO attendance_sessions
    (staff_id, work_date, start_at, end_at, status, duration_minutes)
SELECT
    s.id,
    r.work_date,
    r.start_ts,
    r.start_ts + (r.hrs * INTERVAL '1 hour'),
    'completed',
    (r.hrs * 60)::int
FROM rows r CROSS JOIN s
WHERE NOT EXISTS (
    SELECT 1 FROM attendance_sessions a
    WHERE a.staff_id = s.id AND a.work_date = r.work_date
);
