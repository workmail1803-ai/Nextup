-- =====================================================
-- NextUp Mentor — Add academic & IELTS fields to clients
-- Migration 0006 (ADDITIVE). Idempotent.
-- Adds SSC/HSC results + passing years and IELTS score.
-- =====================================================

-- SSC (Secondary School Certificate)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ssc_result  VARCHAR(10);   -- e.g. "5.00", "A+", "GPA 4.56"
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ssc_year    SMALLINT;      -- e.g. 2018

-- HSC (Higher Secondary Certificate)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hsc_result  VARCHAR(10);   -- e.g. "5.00", "A+", "GPA 4.89"
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hsc_year    SMALLINT;      -- e.g. 2020

-- IELTS
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ielts_score NUMERIC(2,1);  -- e.g. 6.5, 7.0, 8.5

-- =====================================================
-- DONE.
-- =====================================================
