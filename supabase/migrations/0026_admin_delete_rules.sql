-- =====================================================
-- NextUp Mentor — What an admin may delete
-- Migration 0026. Idempotent. Replaces the 0025 delete rule.
--
-- 0025 refused to delete any staff row that still had a login, to stop someone
-- being left able to sign in with nowhere to go. That was too blunt: it stopped
-- an admin removing anyone at all, which is a normal thing to need to do.
--
-- The real rule is simpler:
--   * an admin may remove anyone EXCEPT themselves
--   * the last active admin cannot be removed or demoted by any route
--
-- Self-deletion is barred because it is never what someone means. It ends their
-- own session mid-action, and if they were the only admin nobody can undo it
-- from inside the product.
--
-- The orphaned-login problem is handled properly instead of by refusal: the
-- DELETE /api/admin/staff route removes the auth user FIRST, which nulls
-- auth_user_id through the foreign key, and only then removes the row.
-- =====================================================

CREATE OR REPLACE FUNCTION protect_staff_records() RETURNS TRIGGER
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    admins_left INT;
    me          UUID := current_staff_id();
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Never yourself.
        IF me IS NOT NULL AND OLD.id = me THEN
            RAISE EXCEPTION 'You cannot remove your own account. Ask another admin to do it.';
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

-- =====================================================
-- DONE.
-- =====================================================
