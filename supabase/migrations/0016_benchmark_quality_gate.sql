-- =====================================================
-- NextUp Mentor — Quality gate on the waiting-time benchmark
-- Migration 0016. Idempotent.
--
-- WHY: the archive import looked like it worked. 21 samples, clean percentiles,
-- "students usually reach this stage in about 38 days". Then the raw values:
--
--   meeting, n=16 -> 23.98, 37.32, 37.32, 37.88 x6, 44.85 x6
--
-- Sixteen samples, four distinct values, and seven clients sharing updated_at to
-- the second. Those are bulk-UPDATE artifacts — they measure when a migration
-- ran, not how long anyone waited. Shipped, they would have told a student
-- waiting on a visa that the wait is 38 days, on no evidence at all.
--
-- Two gates, so this cannot recur silently:
--   1. Only `recorded` samples count. Inferred rows stay for provenance and are
--      never allowed to move a number a student reads.
--   2. A spread check. Real durations vary; if the distinct values are too few
--      for the sample size, the data is degenerate and nothing is returned.
-- =====================================================

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
    MIN_SAMPLES  CONSTANT INT := 5;
    -- Real-world durations rarely repeat. Requiring distinct >= 60% of n lets
    -- natural ties through while catching batch-generated data.
    MIN_DISTINCT_RATIO CONSTANT NUMERIC := 0.6;
    n        INT;
    n_dist   INT;
BEGIN
    SELECT COUNT(*), COUNT(DISTINCT s.days)
      INTO n, n_dist
      FROM stage_duration_samples s
     WHERE s.stage = p_stage
       AND s.metric = p_metric
       AND s.source = 'recorded';   -- gate 1

    IF n < MIN_SAMPLES THEN
        RETURN;
    END IF;

    -- gate 2
    IF n_dist::NUMERIC / n::NUMERIC < MIN_DISTINCT_RATIO THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        n,
        0,  -- recorded-only by construction
        ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY s.days)::NUMERIC, 0),
        ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY s.days)::NUMERIC, 0),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY s.days)::NUMERIC, 0)
      FROM stage_duration_samples s
     WHERE s.stage = p_stage AND s.metric = p_metric AND s.source = 'recorded';
END $fn$;

REVOKE ALL ON FUNCTION portal_stage_benchmark(client_stage, benchmark_metric) FROM public;
GRANT EXECUTE ON FUNCTION portal_stage_benchmark(client_stage, benchmark_metric) TO authenticated, anon;

-- =====================================================
-- DONE. The corpus is empty by design and fills as staff move real files
-- through stages. Until it clears both gates the portal shows no estimate,
-- which is the correct thing to show when nothing is known.
-- =====================================================
