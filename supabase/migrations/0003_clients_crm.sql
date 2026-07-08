-- =====================================================
-- NextUp Mentor — Client CRM (clients, meetings, visa)
-- Migration 0003 (ADDITIVE). Run after 0001. Idempotent.
-- Consultants/mentors are `staff` rows (see 0001) referenced by FK.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- Enums -----------------------------------------------------------
DO $$ BEGIN CREATE TYPE degree_level   AS ENUM ('bachelors','masters'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE client_stage   AS ENUM ('lead','meeting','file_open','offer','visa','enrolled','closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE meeting_status AS ENUM ('scheduled','completed','no_show','follow_up','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE visa_status    AS ENUM ('not_started','collecting','ready','submitted','approved','rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE visa_doc_status AS ENUM ('pending','received','verified','na'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- 1. CLIENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name             VARCHAR(200) NOT NULL,
    country_interest      TEXT[] NOT NULL DEFAULT '{}',
    degree               degree_level,
    email                 VARCHAR(255),
    facebook_id           VARCHAR(200),
    whatsapp              VARCHAR(40),
    stage                 client_stage NOT NULL DEFAULT 'lead',
    primary_consultant_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    notes                 TEXT,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_consultant ON clients (primary_consultant_id);
CREATE INDEX IF NOT EXISTS idx_clients_stage      ON clients (stage);
CREATE INDEX IF NOT EXISTS idx_clients_name       ON clients (lower(full_name));
CREATE INDEX IF NOT EXISTS idx_clients_created    ON clients (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_country    ON clients USING GIN (country_interest);

-- =====================================================
-- 2. CLIENT MEETINGS  (each meeting = one mentor at one time)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_meetings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    scheduled_at        TIMESTAMPTZ,
    consultant_id       UUID REFERENCES staff(id) ON DELETE SET NULL,
    consultant_raw      TEXT,                       -- original messy string (e.g. "Avijit+Sourish")
    status              meeting_status NOT NULL DEFAULT 'scheduled',
    comments            TEXT,
    reminder            TEXT,
    follow_up_comments  TEXT,
    follow_up_note      TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_client     ON client_meetings (client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_consultant ON client_meetings (consultant_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled  ON client_meetings (scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_status     ON client_meetings (status);
-- Hot path: a consultant's upcoming/past meetings by time.
CREATE INDEX IF NOT EXISTS idx_meetings_consultant_time
    ON client_meetings (consultant_id, scheduled_at DESC);

-- =====================================================
-- 3. CLIENT VISA  (one per client)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_visa (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id           UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    vfs_appointment_date DATE,
    status              visa_status NOT NULL DEFAULT 'not_started',
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visa_appointment ON client_visa (vfs_appointment_date);
CREATE INDEX IF NOT EXISTS idx_visa_status      ON client_visa (status);

-- =====================================================
-- 4. VISA DOCUMENT ITEMS  (checklist per visa record)
-- =====================================================
CREATE TABLE IF NOT EXISTS visa_document_items (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visa_id       UUID NOT NULL REFERENCES client_visa(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    status        visa_doc_status NOT NULL DEFAULT 'pending',
    note          TEXT,
    sort_order    SMALLINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docitems_visa   ON visa_document_items (visa_id);
CREATE INDEX IF NOT EXISTS idx_docitems_status ON visa_document_items (status);

-- =====================================================
-- 5. updated_at triggers (reuse shared function from 0001)
-- =====================================================
DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS meetings_updated_at ON client_meetings;
CREATE TRIGGER meetings_updated_at BEFORE UPDATE ON client_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS visa_updated_at ON client_visa;
CREATE TRIGGER visa_updated_at BEFORE UPDATE ON client_visa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS docitems_updated_at ON visa_document_items;
CREATE TRIGGER docitems_updated_at BEFORE UPDATE ON visa_document_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 6. RLS — development (permissive); UI enforces roles for now
-- =====================================================
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_meetings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_visa         ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_document_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for clients" ON clients;
CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for client_meetings" ON client_meetings;
CREATE POLICY "Allow all for client_meetings" ON client_meetings FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for client_visa" ON client_visa;
CREATE POLICY "Allow all for client_visa" ON client_visa FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for visa_document_items" ON visa_document_items;
CREATE POLICY "Allow all for visa_document_items" ON visa_document_items FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 7. Realtime
-- =====================================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE clients; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE client_meetings; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE client_visa; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE visa_document_items; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- DONE. Run 0004_seed_clients.sql for the real imported data.
-- =====================================================
