-- =====================================================
-- NextUp Mentor — Client document uploads
-- Migration 0009 (ADDITIVE). Idempotent.
-- Adds a file_url column to visa_document_items so
-- students can upload their documents via the portal.
-- =====================================================

-- Add file_url to store the Supabase Storage path of uploaded files.
ALTER TABLE visa_document_items
  ADD COLUMN IF NOT EXISTS file_url TEXT;

-- =====================================================
-- DONE. Also create the 'client-documents' storage bucket
-- in Supabase (see setup script or do it from the dashboard).
-- =====================================================
