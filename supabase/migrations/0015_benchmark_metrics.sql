-- =====================================================
-- NextUp Mentor — Separate the two waiting-time questions
-- Migration 0015 (ADDITIVE). Idempotent.
--
-- 0014 modelled one metric: how long a file sits IN a stage. That is the right
-- number for "I have lodged my visa, when do I hear back?".
--
-- But it cannot be recovered from the archive. The old records carry only
-- created_at and updated_at, which yields how long a client took to REACH their
-- current stage — a different quantity. Loading one as the other would have put
-- a plausible, wrong number in front of an anxious student, which is the exact
-- failure this feature exists to prevent.
--
-- So both are modelled, and each is labelled:
--   in_stage  days spent sitting in a stage        (live, from the trigger)
--   to_stage  days from enquiry to reaching it     (recoverable from the archive)
--
-- The portal states which one it is showing. It never blends them.
-- =====================================================

DO $$ BEGIN
    CREATE TYPE benchmark_metric AS ENUM ('in_stage', 'to_stage');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE stage_duration_samples
    ADD COLUMN IF NOT EXISTS metric benchmark_metric NOT NULL DEFAULT 'in_stage';

-- The benchmark is always read as (stage, metric), so index the pair.
DROP INDEX IF EXISTS idx_duration_samples_stage;
CREATE INDEX IF NOT EXISTS idx_duration_samples_stage_metric
    ON stage_duration_samples (stage, metric);

-- NO uniqueness constraint on (stage, metric, days, completed_at): two students
-- can legitimately share a duration, and migration 0004 bulk-seeded clients so
-- many share updated_at to the microsecond. A unique index here silently drops
-- real samples. Re-import safety is the importer's job, not the schema's.

-- ---------------------------------------------------------------------------
-- The live trigger measures time IN a stage. State that explicitly rather than
-- leaning on the column default.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_client_stage_change() RETURNS TRIGGER
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    entered_at TIMESTAMPTZ;
    first_seen TIMESTAMPTZ;
    elapsed    NUMERIC;
    since_start NUMERIC;
    dest_country TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO client_stage_events (client_id, from_stage, to_stage, occurred_at, source)
        VALUES (NEW.id, NULL, NEW.stage, COALESCE(NEW.created_at, now()), 'recorded');
        RETURN NEW;
    END IF;

    IF NEW.stage IS DISTINCT FROM OLD.stage THEN
        dest_country := NULLIF(COALESCE(NEW.country_interest[1], ''), '');

        SELECT occurred_at INTO entered_at
          FROM client_stage_events
         WHERE client_id = NEW.id AND to_stage = OLD.stage
         ORDER BY occurred_at DESC LIMIT 1;

        SELECT MIN(occurred_at) INTO first_seen
          FROM client_stage_events WHERE client_id = NEW.id;

        INSERT INTO client_stage_events (client_id, from_stage, to_stage, occurred_at, source)
        VALUES (NEW.id, OLD.stage, NEW.stage, now(), 'recorded');

        -- How long the file sat in the stage it just left.
        IF entered_at IS NOT NULL THEN
            elapsed := EXTRACT(EPOCH FROM (now() - entered_at)) / 86400.0;
            IF elapsed >= 0 AND elapsed < 3650 THEN
                INSERT INTO stage_duration_samples (stage, metric, days, country, source)
                VALUES (OLD.stage, 'in_stage', ROUND(elapsed, 2), dest_country, 'recorded');
            END IF;
        END IF;

        -- How long it took to arrive at the stage it just entered.
        IF first_seen IS NOT NULL THEN
            since_start := EXTRACT(EPOCH FROM (now() - first_seen)) / 86400.0;
            IF since_start >= 0 AND since_start < 3650 THEN
                INSERT INTO stage_duration_samples (stage, metric, days, country, source)
                VALUES (NEW.stage, 'to_stage', ROUND(since_start, 2), dest_country, 'recorded');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END $fn$;

-- ---------------------------------------------------------------------------
-- Benchmark, now metric-aware.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS portal_stage_benchmark(client_stage);

CREATE OR REPLACE FUNCTION portal_stage_benchmark(
    p_stage  client_stage,
    p_metric benchmark_metric DEFAULT 'in_stage'
)
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
    SELECT COUNT(*) INTO n
      FROM stage_duration_samples s
     WHERE s.stage = p_stage AND s.metric = p_metric;

    -- Below the floor, return nothing. A range built on three files would read
    -- as fact to someone checking it nightly.
    IF n < MIN_SAMPLES THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        n,
        (SELECT COUNT(*)::INT FROM stage_duration_samples s2
          WHERE s2.stage = p_stage AND s2.metric = p_metric AND s2.source = 'inferred'),
        ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY s.days)::NUMERIC, 0),
        ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY s.days)::NUMERIC, 0),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY s.days)::NUMERIC, 0)
      FROM stage_duration_samples s
     WHERE s.stage = p_stage AND s.metric = p_metric;
END $fn$;

REVOKE ALL ON FUNCTION portal_stage_benchmark(client_stage, benchmark_metric) FROM public;
GRANT EXECUTE ON FUNCTION portal_stage_benchmark(client_stage, benchmark_metric) TO authenticated, anon;

-- =====================================================
-- DONE.
-- =====================================================
