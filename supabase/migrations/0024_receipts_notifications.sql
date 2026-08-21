-- =====================================================
-- NextUp Mentor — Receipts + portal notifications
-- Migration 0024. Idempotent.
--
-- Staff issue a receipt against a client. It appears in that student's portal
-- immediately, announced by a notification, and can be emailed to them.
--
-- MONEY IS STORED IN MINOR UNITS (poisha). Floating point cannot represent
-- 0.1 exactly, so a column of NUMERIC totals that were summed as floats
-- eventually disagrees with the paper. Integers cannot drift.
--
-- RECEIPT NUMBERS ARE GAP-FREE, from a real sequence claimed inside the
-- transaction. A receipt is a financial document: "where is NMB0220275?" must
-- have an answer, so numbers are never skipped by a failed insert or handed to
-- two staff at once.
-- =====================================================

-- ---------------------------------------------------------------------------
-- 1. Notifications — the portal's message list. Migration 0007 defined a
--    staff-only version that was never applied; this is the student-facing one.
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE notification_kind AS ENUM ('receipt', 'document', 'meeting', 'stage', 'message');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS client_notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    kind        notification_kind NOT NULL DEFAULT 'message',
    title       TEXT NOT NULL,
    body        TEXT,
    /** Where tapping it should go, e.g. /portal/receipts. */
    link        TEXT,
    read_at     TIMESTAMPTZ,
    sent_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The portal asks "my unread, newest first" on every visit; staff never query
-- these, so one composite index covers the only real access path.
CREATE INDEX IF NOT EXISTS idx_notif_client_time ON client_notifications (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON client_notifications (client_id) WHERE read_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Receipt numbering
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS receipt_seq START 10001;

CREATE OR REPLACE FUNCTION next_receipt_number() RETURNS TEXT
    LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT 'NM' || to_char(now() AT TIME ZONE 'Asia/Dhaka', 'MMDD')
                || lpad(nextval('receipt_seq')::TEXT, 5, '0');
$fn$;

REVOKE ALL ON FUNCTION next_receipt_number() FROM public;
GRANT EXECUTE ON FUNCTION next_receipt_number() TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Receipts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receipts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    receipt_no    TEXT NOT NULL UNIQUE,

    -- Copied, not joined. A receipt is a record of what was said at the time:
    -- if the client later changes their name or a package is repriced, the
    -- issued document must not silently change with it.
    issued_to_name  TEXT NOT NULL,
    issued_to_email TEXT,
    company_name    TEXT NOT NULL DEFAULT 'NextUp Mentor',
    doc_title       TEXT NOT NULL DEFAULT 'PAYMENT RECEIPT.',
    footer_note     TEXT NOT NULL DEFAULT 'This receipt confirms that the above payment has been received.',

    issued_on     DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Dhaka')::DATE,
    currency      TEXT NOT NULL DEFAULT 'BDT',

    -- Minor units. See header.
    subtotal_minor  BIGINT NOT NULL DEFAULT 0 CHECK (subtotal_minor >= 0),
    discount_minor  BIGINT NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
    paid_minor      BIGINT NOT NULL DEFAULT 0 CHECK (paid_minor >= 0),

    payment_method  TEXT,
    transaction_id  TEXT,
    package_id      UUID REFERENCES packages(id) ON DELETE SET NULL,

    issued_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    emailed_at    TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- total and due are derived, never stored — two columns that must agree will
-- eventually not.
CREATE OR REPLACE VIEW receipts_with_totals AS
    SELECT r.*,
           (r.subtotal_minor - r.discount_minor) AS total_minor,
           GREATEST((r.subtotal_minor - r.discount_minor) - r.paid_minor, 0) AS due_minor
      FROM receipts r;

GRANT SELECT ON receipts_with_totals TO authenticated;

CREATE INDEX IF NOT EXISTS idx_receipts_client ON receipts (client_id, issued_on DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_issued_by ON receipts (issued_by_staff_id);

CREATE TABLE IF NOT EXISTS receipt_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id  UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    -- The model has a bold main line and quieter sub-lines (e.g. "Transaction
    -- Charge"). `is_sub` carries that so the layout is data, not a guess.
    is_sub      BOOLEAN NOT NULL DEFAULT FALSE,
    price_minor BIGINT NOT NULL DEFAULT 0,
    sort_order  SMALLINT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_receipt_items ON receipt_items (receipt_id, sort_order);

DROP TRIGGER IF EXISTS trg_receipts_updated ON receipts;
CREATE TRIGGER trg_receipts_updated BEFORE UPDATE ON receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE receipts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "receipts staff"    ON receipts;
DROP POLICY IF EXISTS "receipts portal"   ON receipts;
DROP POLICY IF EXISTS "receipts service"  ON receipts;
CREATE POLICY "receipts staff" ON receipts
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());
-- A student reads their own. They never write: a receipt they could edit is
-- not evidence of anything.
CREATE POLICY "receipts portal" ON receipts
    FOR SELECT TO authenticated
    USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));
CREATE POLICY "receipts service" ON receipts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "receipt items staff"   ON receipt_items;
DROP POLICY IF EXISTS "receipt items portal"  ON receipt_items;
DROP POLICY IF EXISTS "receipt items service" ON receipt_items;
CREATE POLICY "receipt items staff" ON receipt_items
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY "receipt items portal" ON receipt_items
    FOR SELECT TO authenticated
    USING (receipt_id IN (
        SELECT r.id FROM receipts r
        JOIN clients c ON c.id = r.client_id
        WHERE c.auth_user_id = auth.uid()
    ));
CREATE POLICY "receipt items service" ON receipt_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notif staff"   ON client_notifications;
DROP POLICY IF EXISTS "notif portal"  ON client_notifications;
DROP POLICY IF EXISTS "notif service" ON client_notifications;
CREATE POLICY "notif staff" ON client_notifications
    FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());
-- A student may read theirs and mark them read; nothing else.
CREATE POLICY "notif portal" ON client_notifications
    FOR SELECT TO authenticated
    USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));
CREATE POLICY "notif service" ON client_notifications
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION portal_mark_notifications_read() RETURNS VOID
    LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
    UPDATE client_notifications
       SET read_at = now()
     WHERE read_at IS NULL
       AND client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid());
$fn$;

REVOKE ALL ON FUNCTION portal_mark_notifications_read() FROM public;
GRANT EXECUTE ON FUNCTION portal_mark_notifications_read() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Issue a receipt: number, rows, and the student's notification, atomically.
--    Split across separate calls, a crash could leave a numbered receipt with
--    no line items, or a notification pointing at nothing.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION staff_issue_receipt(
    p_client_id      UUID,
    p_items          JSONB,           -- [{description, price_minor, is_sub}]
    p_paid_minor     BIGINT DEFAULT 0,
    p_discount_minor BIGINT DEFAULT 0,
    p_payment_method TEXT DEFAULT NULL,
    p_transaction_id TEXT DEFAULT NULL,
    p_package_id     UUID DEFAULT NULL,
    p_issued_on      DATE DEFAULT NULL,
    p_doc_title      TEXT DEFAULT NULL,
    p_footer_note    TEXT DEFAULT NULL,
    p_currency       TEXT DEFAULT 'BDT',
    p_name_override  TEXT DEFAULT NULL,
    p_email_override TEXT DEFAULT NULL,
    p_notify         BOOLEAN DEFAULT TRUE
) RETURNS UUID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    me       UUID := current_staff_id();
    c        clients%ROWTYPE;
    rid      UUID;
    rno      TEXT;
    subtotal BIGINT := 0;
    item     JSONB;
    idx      INT := 0;
BEGIN
    IF NOT is_staff() THEN RAISE EXCEPTION 'staff only'; END IF;

    SELECT * INTO c FROM clients WHERE id = p_client_id;
    IF c.id IS NULL THEN RAISE EXCEPTION 'that client no longer exists'; END IF;
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'add at least one line to the receipt';
    END IF;

    -- Sub-lines (charges, notes) do not contribute to the subtotal.
    FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        IF NOT COALESCE((item->>'is_sub')::BOOLEAN, FALSE) THEN
            subtotal := subtotal + COALESCE((item->>'price_minor')::BIGINT, 0);
        END IF;
    END LOOP;

    IF p_discount_minor > subtotal THEN
        RAISE EXCEPTION 'the discount is larger than the subtotal';
    END IF;
    IF p_paid_minor > (subtotal - p_discount_minor) THEN
        RAISE EXCEPTION 'paid is more than the total bill';
    END IF;

    rno := next_receipt_number();

    INSERT INTO receipts (
        client_id, receipt_no, issued_to_name, issued_to_email, doc_title,
        footer_note, issued_on, currency, subtotal_minor, discount_minor,
        paid_minor, payment_method, transaction_id, package_id, issued_by_staff_id
    ) VALUES (
        c.id, rno,
        COALESCE(NULLIF(btrim(p_name_override), ''), c.full_name),
        COALESCE(NULLIF(btrim(p_email_override), ''), c.email),
        COALESCE(NULLIF(btrim(p_doc_title), ''), 'PAYMENT RECEIPT.'),
        COALESCE(NULLIF(btrim(p_footer_note), ''),
                 'This receipt confirms that the above payment has been received.'),
        COALESCE(p_issued_on, (now() AT TIME ZONE 'Asia/Dhaka')::DATE),
        COALESCE(NULLIF(p_currency, ''), 'BDT'),
        subtotal, p_discount_minor, p_paid_minor,
        p_payment_method, p_transaction_id, p_package_id, me
    )
    RETURNING id INTO rid;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        idx := idx + 1;
        INSERT INTO receipt_items (receipt_id, description, is_sub, price_minor, sort_order)
        VALUES (
            rid,
            COALESCE(item->>'description', ''),
            COALESCE((item->>'is_sub')::BOOLEAN, FALSE),
            COALESCE((item->>'price_minor')::BIGINT, 0),
            idx
        );
    END LOOP;

    -- Only worth announcing to someone who can actually open the portal.
    IF p_notify AND c.auth_user_id IS NOT NULL THEN
        INSERT INTO client_notifications (client_id, kind, title, body, link, sent_by_staff_id)
        VALUES (
            c.id, 'receipt',
            'Your payment receipt is ready',
            'Receipt ' || rno || ' has been added to your file.',
            '/portal/receipts', me
        );
    END IF;

    RETURN rid;
END $fn$;

REVOKE ALL ON FUNCTION staff_issue_receipt(UUID, JSONB, BIGINT, BIGINT, TEXT, TEXT, UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM public;
GRANT EXECUTE ON FUNCTION staff_issue_receipt(UUID, JSONB, BIGINT, BIGINT, TEXT, TEXT, UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. A free-text note from staff to a student, for the same notification list.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION staff_notify_client(
    p_client_id UUID,
    p_title     TEXT,
    p_body      TEXT DEFAULT NULL,
    p_link      TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
    me  UUID := current_staff_id();
    nid UUID;
BEGIN
    IF NOT is_staff() THEN RAISE EXCEPTION 'staff only'; END IF;
    IF p_title IS NULL OR length(btrim(p_title)) < 2 THEN
        RAISE EXCEPTION 'the message needs a subject';
    END IF;

    INSERT INTO client_notifications (client_id, kind, title, body, link, sent_by_staff_id)
    VALUES (p_client_id, 'message', btrim(p_title), NULLIF(btrim(p_body), ''), p_link, me)
    RETURNING id INTO nid;

    RETURN nid;
END $fn$;

REVOKE ALL ON FUNCTION staff_notify_client(UUID, TEXT, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION staff_notify_client(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- DONE.
-- =====================================================
