-- =====================================================
-- NextUp Mentor — In-app notifications (auto, trigger-driven)
-- Migration 0007 (ADDITIVE). Idempotent.
--
-- A mentor is notified AUTOMATICALLY (via DB triggers, so it works no matter
-- which app action caused it) when:
--   • a client_meeting is created/assigned with them as consultant
--   • a public appointment is confirmed with them as assigned mentor
-- The staff portal subscribes via realtime and shows a notification bell.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS notifications (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    type               VARCHAR(40) NOT NULL DEFAULT 'general',
    title              VARCHAR(200) NOT NULL,
    body               TEXT,
    link               VARCHAR(255),
    is_read            BOOLEAN NOT NULL DEFAULT FALSE,
    meta               JSONB,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_staff_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON notifications (created_at DESC);
-- Hot path: a mentor's unread notifications, newest first.
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON notifications (recipient_staff_id, created_at DESC) WHERE is_read = FALSE;

-- ---- RLS (permissive dev) ---------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for notifications" ON notifications;
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ---- Realtime ---------------------------------------------------------------
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE notifications; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- Trigger: notify the mentor when a meeting is assigned to them
-- =====================================================
CREATE OR REPLACE FUNCTION notify_meeting_mentor() RETURNS TRIGGER AS $$
DECLARE
    cname TEXT;
    whenstr TEXT;
BEGIN
    IF NEW.consultant_id IS NOT NULL
       AND (TG_OP = 'INSERT' OR NEW.consultant_id IS DISTINCT FROM OLD.consultant_id) THEN
        SELECT full_name INTO cname FROM clients WHERE id = NEW.client_id;
        whenstr := CASE
            WHEN NEW.scheduled_at IS NOT NULL
            THEN ' · ' || to_char(NEW.scheduled_at AT TIME ZONE 'Asia/Dhaka', 'Dy DD Mon, HH12:MI AM')
            ELSE '' END;
        INSERT INTO notifications (recipient_staff_id, type, title, body, link, meta)
        VALUES (
            NEW.consultant_id,
            'meeting',
            'New meeting assigned to you',
            COALESCE(cname, 'A client') || whenstr,
            '/staff_portal/clients',
            jsonb_build_object('meeting_id', NEW.id, 'client_id', NEW.client_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_meeting_mentor ON client_meetings;
CREATE TRIGGER trg_notify_meeting_mentor
    AFTER INSERT OR UPDATE ON client_meetings
    FOR EACH ROW EXECUTE FUNCTION notify_meeting_mentor();

-- =====================================================
-- Trigger: notify the mentor when an appointment is confirmed with them
-- =====================================================
CREATE OR REPLACE FUNCTION notify_appointment_confirmed() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND NEW.assigned_mentor_id IS NOT NULL
       AND (TG_OP = 'INSERT'
            OR NEW.status IS DISTINCT FROM OLD.status
            OR NEW.assigned_mentor_id IS DISTINCT FROM OLD.assigned_mentor_id) THEN
        INSERT INTO notifications (recipient_staff_id, type, title, body, link, meta)
        VALUES (
            NEW.assigned_mentor_id,
            'appointment',
            'Appointment confirmed',
            NEW.name || COALESCE(' · ' || NEW.phone, ''),
            '/staff_portal/appointments',
            jsonb_build_object('appointment_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_appointment_confirmed ON appointments;
CREATE TRIGGER trg_notify_appointment_confirmed
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION notify_appointment_confirmed();
