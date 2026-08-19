-- =====================================================
-- NextUp Mentor — Fresh start: clear operational data
-- Migration 0011 (DESTRUCTIVE). Run once.
--
-- Approved scope: clients + appointments + finance.
--
-- DELETED
--   clients                (cascades -> client_meetings, client_visa,
--                                       visa_document_items)
--   appointments
--   expenses, expense_logs, budgets
--   storage objects under the client-documents bucket
--
-- KEPT
--   staff                  (roles/auth from 0010 live here)
--   expense_categories     (taxonomy/config, not records -- 17 rows worth
--                           re-typing by hand; say the word and they go too)
--   packages, destinations, messages, enrollments, attendance_sessions
--   auth.users             (4 rows, none ever completed a sign-in; harmless.
--                           A returning student simply re-claims a new record.)
--
-- A full JSON backup of every table was taken to ./backups/<timestamp>/
-- before this ran.
-- =====================================================

BEGIN;

-- NOTE: the client-documents bucket must be emptied FIRST, via the Storage API
-- rather than here. Postgres blocks `DELETE FROM storage.objects` outright
-- (storage.protect_delete), because deleting the row would strand the actual
-- file in the object store. Objects were removed with:
--   DELETE /storage/v1/object/client-documents  {"prefixes":[...]}
-- and copied to ./backups/<timestamp>/client-documents/ first.

-- Appointments reference clients with ON DELETE SET NULL, so they must be
-- removed explicitly -- the client cascade would only null the column.
DELETE FROM appointments;

-- Cascades to client_meetings, client_visa, and visa_document_items.
DELETE FROM clients;

-- Finance records. expense_logs first (FK -> expenses).
DELETE FROM expense_logs;
DELETE FROM expenses;
DELETE FROM budgets;

COMMIT;
