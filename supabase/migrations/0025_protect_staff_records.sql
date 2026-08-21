-- =====================================================
-- NextUp Mentor — Stop an admin locking people (or themselves) out
-- Migration 0025. Idempotent.
--
-- WHAT HAPPENED
--   A staff row was deleted from the admin panel. The matching auth user stayed
--   behind, so that person could still sign in — and then the app could not
--   resolve them to anybody, so the gate silently redisplayed the login form.
--   From their side: correct password, button does nothing, no explanation.
--
-- TWO GUARDS
--   1. Deleting a staff row that still has a live login is refused. Deactivate
--      instead — it revokes access, keeps their history attached, and is
--      reversible. Deletion is only for records that never became a person.
--   2. The last active admin cannot be deleted or demoted. Whoever does it
--      would lock every remaining person out of the admin panel permanently,
--      including themselves, with no way back in from inside the product.
-- =====================================================

CREATE OR REPLACE FUNCTION protect_staff_records() RETURNS TRIGGER
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    admins_left INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.auth_user_id IS NOT NULL THEN
            RAISE EXCEPTION
              'This person has a working login. Set them to Disabled instead — deleting the record leaves them able to sign in with nowhere to go.';
        END IF;

        IF OLD.role = 'admin' AND OLD.status = 'active' THEN
            SELECT COUNT(*) INTO admins_left
              FROM staff
             WHERE role = 'admin' AND status = 'active' AND id <> OLD.id;
            IF admins_left = 0 THEN
                RAISE EXCEPTION 'That is the last admin. Promote someone else first, or nobody can administer the system.';
            END IF;
        END IF;

        RETURN OLD;
    END IF;

    -- Demoting or disabling the last admin is the same lockout by another route.
    IF OLD.role = 'admin' AND OLD.status = 'active'
       AND (NEW.role <> 'admin' OR NEW.status <> 'active')
    THEN
        SELECT COUNT(*) INTO admins_left
          FROM staff
         WHERE role = 'admin' AND status = 'active' AND id <> OLD.id;
        IF admins_left = 0 THEN
            RAISE EXCEPTION 'That is the last admin. Promote someone else first.';
        END IF;
    END IF;

    RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_protect_staff_records ON staff;
CREATE TRIGGER trg_protect_staff_records
    BEFORE UPDATE OR DELETE ON staff
    FOR EACH ROW EXECUTE FUNCTION protect_staff_records();

-- =====================================================
-- DONE.
-- =====================================================
