-- =====================================================
-- NextUp Mentor — Stage history + waiting-time benchmarks
-- Migration 0014 (ADDITIVE). Idempotent.
--
-- WHY: `clients.stage` records where a file IS, never when it moved. So the
-- portal can only ever say "you are at the visa stage" — not "you have been
-- there 12 days, and students usually hear back in 22–41."
--
-- The second sentence is the product. Unbounded waiting is what makes a student
-- anxious; a bounded wait with a real range does not. This migration is what
-- makes that sentence possible.
--
-- TWO TABLES, DELIBERATELY SEPARATE:
--   client_stage_events    per-client history. Private. Drives their timeline.
--   stage_duration_samples anonymised durations only. Aggregate. Drives the
--                          benchmark, and can be read by a student WITHOUT
--                          exposing any other student's record.
--
-- TRUST RULE encoded here: every row carries `source`. 'recorded' means we
-- watched it happen; 'inferred' means it was reconstructed from created_at /
-- updated_at. The UI must never present inferred as recorded — see
-- portal_stage_benchmark(), which reports the split so the caller can.
-- =====================================================

-- ---------------------------------------------------------------------------
-- 1. Per-client stage history
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE stage_event_source AS ENUM ('recorded', 'inferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS client_stage_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    from_stage    client_stage,                    -- NULL for the first entry
    to_stage      client_stage NOT NULL,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    source        stage_event_source NOT NULL DEFAULT 'recorded',
    note          TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One index per access path, as asked:
--   client_id + occurred_at  the portal timeline (every read is "my file, in order")
--   to_stage                 "who is sitting in visa right now"
--   occurred_at              recent-activity feeds in the CRM
CREATE INDEX IF NOT EXISTS idx_stage_events_client_time ON client_stage_events (client_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_events_to_stage    ON client_stage_events (to_stage);
CREATE INDEX IF NOT EXISTS idx_stage_events_occurred    ON client_stage_events (occurred_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Anonymised duration corpus
--
-- Holds NO client reference on purpose. A student must be able to ask "how long
-- does this stage usually take" without that query touching anyone's record.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stage_duration_samples (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage       client_stage NOT NULL,
    days        NUMERIC(6,2) NOT NULL CHECK (days >= 0),
    country     TEXT,                              -- for a future per-country cut
    source      stage_event_source NOT NULL DEFAULT 'recorded',
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duration_samples_stage ON stage_duration_samples (stage);
CREATE INDEX IF NOT EXISTS idx_duration_samples_when  ON stage_duration_samples (completed_at DESC);

-- ---------------------------------------------------------------------------
-- 3. The trigger. Stage changes are logged by the database, not the app, so a
--    move made from the CRM, the admin panel, or a hand-written SQL fix all
--    produce history. App-side logging would miss two of those three.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_client_stage_change() RETURNS TRIGGER
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    entered_at TIMESTAMPTZ;
    elapsed    NUMERIC;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO client_stage_events (client_id, from_stage, to_stage, occurred_at, source)
        VALUES (NEW.id, NULL, NEW.stage, COALESCE(NEW.created_at, now()), 'recorded');
        RETURN NEW;
    END IF;

    IF NEW.stage IS DISTINCT FROM OLD.stage THEN
        -- How long the file sat in the stage it is leaving.
        SELECT occurred_at INTO entered_at
          FROM client_stage_events
         WHERE client_id = NEW.id AND to_stage = OLD.stage
         ORDER BY occurred_at DESC
         LIMIT 1;

        INSERT INTO client_stage_events (client_id, from_stage, to_stage, occurred_at, source)
        VALUES (NEW.id, OLD.stage, NEW.stage, now(), 'recorded');

        IF entered_at IS NOT NULL THEN
            elapsed := EXTRACT(EPOCH FROM (now() - entered_at)) / 86400.0;
            -- Guard against clock skew and same-second corrections.
            IF elapsed >= 0 AND elapsed < 3650 THEN
                INSERT INTO stage_duration_samples (stage, days, country, source)
                VALUES (
                    OLD.stage,
                    ROUND(elapsed, 2),
                    NULLIF(COALESCE(NEW.country_interest[1], ''), ''),
                    'recorded'
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_client_stage_insert ON clients;
CREATE TRIGGER trg_client_stage_insert
    AFTER INSERT ON clients
    FOR EACH ROW EXECUTE FUNCTION log_client_stage_change();

DROP TRIGGER IF EXISTS trg_client_stage_update ON clients;
CREATE TRIGGER trg_client_stage_update
    AFTER UPDATE OF stage ON clients
    FOR EACH ROW EXECUTE FUNCTION log_client_stage_change();

-- ---------------------------------------------------------------------------
-- 4. Backfill history for clients that already exist.
--    Marked 'inferred' — created_at/updated_at are the only evidence available,
--    and updated_at moves for any edit, not just a stage change.
-- ---------------------------------------------------------------------------
INSERT INTO client_stage_events (client_id, from_stage, to_stage, occurred_at, source, note)
SELECT c.id, NULL, 'lead'::client_stage, c.created_at, 'inferred',
       'Reconstructed from the client record; no transition was logged at the time.'
  FROM clients c
 WHERE NOT EXISTS (SELECT 1 FROM client_stage_events e WHERE e.client_id = c.id);

INSERT INTO client_stage_events (client_id, from_stage, to_stage, occurred_at, source, note)
SELECT c.id, 'lead'::client_stage, c.stage, GREATEST(c.updated_at, c.created_at), 'inferred',
       'Reconstructed from the client record; no transition was logged at the time.'
  FROM clients c
 WHERE c.stage <> 'lead'
   AND NOT EXISTS (
       SELECT 1 FROM client_stage_events e
        WHERE e.client_id = c.id AND e.to_stage = c.stage
   );

-- ---------------------------------------------------------------------------
-- 5. The benchmark, as a SECURITY DEFINER function.
--
--    A function rather than a view so a student can be granted the AGGREGATE
--    without being granted the table. It also enforces the honesty rules in one
--    place instead of trusting every caller to remember them:
--      * below MIN_SAMPLES it returns nothing at all rather than a shaky range
--      * it always reports n, and how much of n is inferred
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION portal_stage_benchmark(p_stage client_stage)
RETURNS TABLE (
    sample_size    INT,
    inferred_count INT,
    p25_days       NUMERIC,
    median_days    NUMERIC,
    p75_days       NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    MIN_SAMPLES CONSTANT INT := 5;
    n INT;
BEGIN
    SELECT COUNT(*) INTO n FROM stage_duration_samples s WHERE s.stage = p_stage;

    -- Too thin to be honest about. Say nothing rather than imply precision.
    IF n < MIN_SAMPLES THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        n,
        (SELECT COUNT(*)::INT FROM stage_duration_samples s
          WHERE s.stage = p_stage AND s.source = 'inferred'),
        ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY s.days)::NUMERIC, 0),
        ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY s.days)::NUMERIC, 0),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY s.days)::NUMERIC, 0)
      FROM stage_duration_samples s
     WHERE s.stage = p_stage;
END $fn$;

REVOKE ALL ON FUNCTION portal_stage_benchmark(client_stage) FROM public;
GRANT EXECUTE ON FUNCTION portal_stage_benchmark(client_stage) TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE client_stage_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_duration_samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stage events staff"   ON client_stage_events;
DROP POLICY IF EXISTS "stage events portal"  ON client_stage_events;
DROP POLICY IF EXISTS "stage events service" ON client_stage_events;

CREATE POLICY "stage events staff" ON client_stage_events
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

-- A student reads their own history, and only their own.
CREATE POLICY "stage events portal" ON client_stage_events
    FOR SELECT TO authenticated
    USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));

CREATE POLICY "stage events service" ON client_stage_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- The corpus is reachable ONLY through portal_stage_benchmark(). No direct
-- select policy: individual durations are a side channel about other students'
-- files, even without names attached.
DROP POLICY IF EXISTS "duration samples staff"   ON stage_duration_samples;
DROP POLICY IF EXISTS "duration samples service" ON stage_duration_samples;

CREATE POLICY "duration samples staff" ON stage_duration_samples
    FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "duration samples service" ON stage_duration_samples
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- DONE.
-- =====================================================
